import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Transport for the Splitz mail API (see API_USAGE.md).
 *
 * Send-only: `POST /send` with a bearer token. Callers get an EmailResult
 * rather than an exception — email is best-effort everywhere it is used, and
 * must never fail the write it accompanies.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailResult = { sent: boolean; messageId?: string; error?: string };

const MAX_ATTEMPTS = 3;

/** The API only accepts senders on split-z.com. */
const FROM_ADDRESS = "hello@split-z.com";
const FROM_NAME = "Splitz";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function send(message: EmailMessage): Promise<EmailResult> {
  const { env } = getCloudflareContext();
  const apiKey = env.MAIL_API_KEY;

  if (!apiKey) {
    // Local dev without a key: log rather than fail, so flows stay usable.
    console.log("[email] MAIL_API_KEY not set, skipping send", {
      to: message.to,
      subject: message.subject,
    });
    return { sent: false, error: "MAIL_API_KEY not configured" };
  }

  const url = `${env.MAIL_API_URL ?? "https://mail-api.split-z.com"}/send`;
  const body = JSON.stringify({
    from: FROM_ADDRESS,
    from_name: FROM_NAME,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  let lastError = "unknown error";

  // Only 502s and network failures are retryable; a 4xx means the request
  // itself is wrong and resending it will fail identically.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message_id?: string;
        };
        return { sent: true, messageId: data.message_id };
      }

      const { detail } = (await res.json().catch(() => ({
        detail: res.statusText,
      }))) as { detail?: string };
      lastError = `mail api ${res.status}: ${detail ?? res.statusText}`;

      if (res.status !== 502) {
        console.error("[email] send failed", lastError);
        return { sent: false, error: lastError };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_ATTEMPTS) {
      await delay(200 * 2 ** (attempt - 1));
    }
  }

  console.error("[email] send failed after retries", lastError);
  return { sent: false, error: lastError };
}

export async function sendGroupInviteEmail(params: {
  to: string;
  name: string;
  groupName: string;
  shareCode: string;
}): Promise<EmailResult> {
  const { env } = getCloudflareContext();
  const appUrl = env.APP_URL ?? "https://split-z.com";
  const link = `${appUrl}/groups/${params.shareCode}`;

  const name = escapeHtml(params.name);
  const groupName = escapeHtml(params.groupName);

  return send({
    to: params.to,
    subject: `You've been added to "${params.groupName}" on Splitz`,
    html: [
      `<p>Hi ${name},</p>`,
      `<p>You've been added to the group <strong>${groupName}</strong> on Splitz.</p>`,
      `<p><a href="${link}">View the group and settle up</a></p>`,
      `<p style="color:#666;font-size:13px">If the link doesn't work, paste this into your browser:<br>${link}</p>`,
    ].join("\n"),
    text: [
      `Hi ${params.name},`,
      "",
      `You've been added to the group "${params.groupName}" on Splitz.`,
      `View the group and settle up here: ${link}`,
    ].join("\n"),
  });
}
