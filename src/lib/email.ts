import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Placeholder email transport.
 *
 * No provider is wired up yet. Until an API key lands in the EMAIL_API_KEY
 * secret, this logs the message and reports success so the calling flows are
 * not blocked. Swap the body of `send` for the real provider call — the
 * signature below is what the rest of the app depends on.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailResult = { sent: boolean; error?: string };

async function send(message: EmailMessage): Promise<EmailResult> {
  const { env } = getCloudflareContext();
  const apiKey = env.EMAIL_API_KEY;

  if (!apiKey) {
    console.log("[email:placeholder] would send", {
      to: message.to,
      subject: message.subject,
    });
    return { sent: false, error: "EMAIL_API_KEY not configured" };
  }

  // TODO: replace with the real provider request once the API is provided.
  console.log("[email:placeholder] API key present but no provider wired up");
  return { sent: false, error: "email provider not implemented" };
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

  return send({
    to: params.to,
    subject: `You've been added to "${params.groupName}" on Splitz`,
    text: [
      `Hi ${params.name},`,
      "",
      `You've been added to the group "${params.groupName}" on Splitz.`,
      `View the group and settle up here: ${link}`,
    ].join("\n"),
  });
}
