# Mail API — Integration Guide

Instructions for another application to send email through this service.
This is a **send-only** HTTP API. One endpoint: `POST /send`.

## Base URL

```
https://mail-api.split-z.com
```

- All requests use HTTPS.
- Health check (no auth): `GET /health` → `{"status":"ok"}`.

> If the HTTPS cert isn't live yet, it's because DNS/ports for
> `mail-api.split-z.com` are still propagating. Verify with
> `curl https://mail-api.split-z.com/health` before integrating.

## Authentication

Every request to `/send` must include a bearer token:

```
Authorization: Bearer <API_KEY>
```

- **Never hard-code the key.** Read it from an environment variable
  (e.g. `MAIL_API_KEY`) or your app's secret store.
- Requests without a valid key get `401`.

## Endpoint: `POST /send`

`Content-Type: application/json`. Body fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `from` | string (email) | ✅ | Domain **must be `split-z.com`** (e.g. `hello@split-z.com`). Any other domain → `403`. |
| `to` | string[] (email) | ✅ | 1–50 recipients. |
| `subject` | string | ✅ | 1–255 chars. |
| `html` | string | ✅ | HTML body. |
| `from_name` | string | ✗ | Display name, e.g. `"Split-Z"`. Max 120 chars. |
| `text` | string | ✗ | Plain-text alternative. Auto-derived from `html` if omitted. |
| `reply_to` | string (email) | ✗ | Sets the `Reply-To` header. |

### Success — `200`

```json
{ "status": "sent", "message_id": "<...@split-z.com>", "recipients": 1 }
```

`status: "sent"` means the message was accepted by the mail server for delivery.

### Errors

| Code | Meaning | Fix |
|---|---|---|
| `401` | Missing/invalid API key | Check the `Authorization: Bearer` header. |
| `403` | `from` domain not allowed | Use a `@split-z.com` sender. |
| `422` | Validation error | Malformed email, empty `to`, >50 recipients, missing required field. |
| `502` | Mail server rejected submission | Transient/server-side; safe to retry with backoff. |

Error bodies look like `{ "detail": "<reason>" }`.

## Examples

### curl

```bash
curl -X POST https://mail-api.split-z.com/send \
  -H "Authorization: Bearer $MAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "hello@split-z.com",
    "from_name": "Split-Z",
    "to": ["user@example.com"],
    "subject": "Welcome",
    "html": "<h1>Hi</h1><p>Thanks for signing up.</p>",
    "reply_to": "support@split-z.com"
  }'
```

### TypeScript / JavaScript (fetch — works in Bun, Node 18+, Deno)

```ts
export interface SendEmailInput {
  from: string;            // must be @split-z.com
  to: string[];            // 1–50 recipients
  subject: string;
  html: string;
  fromName?: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.MAIL_API_KEY;
  if (!apiKey) throw new Error("MAIL_API_KEY is not set");

  const res = await fetch("https://mail-api.split-z.com/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      from_name: input.fromName,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });

  if (!res.ok) {
    const { detail } = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`Mail API ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { message_id: string };
  return data.message_id;
}
```

### Python (httpx)

```python
import os
import httpx

def send_email(*, to: list[str], subject: str, html: str,
               sender: str = "hello@split-z.com",
               from_name: str | None = None,
               text: str | None = None,
               reply_to: str | None = None) -> str:
    api_key = os.environ["MAIL_API_KEY"]
    payload = {
        "from": sender, "from_name": from_name, "to": to,
        "subject": subject, "html": html, "text": text, "reply_to": reply_to,
    }
    payload = {k: v for k, v in payload.items() if v is not None}

    r = httpx.post(
        "https://mail-api.split-z.com/send",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload, timeout=30,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Mail API {r.status_code}: {r.json().get('detail')}")
    return r.json()["message_id"]
```

## Constraints & tips

- **Sender domain:** only `@split-z.com` is currently permitted.
- **HTML is required;** if you don't supply `text`, a plain-text fallback is
  generated automatically (good for deliverability — always send both when you
  can by providing `text`).
- **Recipients:** up to 50 per request. For larger sends, batch and paginate.
- **Retries:** retry only on `502` (and network errors), with exponential
  backoff. Do **not** retry `4xx` — the request itself needs fixing.
- **Idempotency:** the API does not deduplicate; don't auto-resend a request that
  already returned `200`.
- **Secrets:** keep `MAIL_API_KEY` out of source control, logs, and client-side
  code. This API must only ever be called from your backend.
