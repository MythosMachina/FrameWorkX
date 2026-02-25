export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMailShell(input: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
  instanceLabel?: string;
  instanceUrl?: string;
}) {
  const label = input.instanceLabel ? escapeHtml(input.instanceLabel) : "FrameWorkX";
  const title = escapeHtml(input.title);
  const subtitle = input.subtitle ? escapeHtml(input.subtitle) : "";
  const subtitleLine = subtitle ? `<div style="margin-top:4px;color:#f4d7a4;">${subtitle}</div>` : "";
  const link = input.instanceUrl
    ? `<a href="${escapeHtml(input.instanceUrl)}" style="color:#e0b46b;text-decoration:none;">${escapeHtml(input.instanceUrl)}</a>`
    : "";
  return `
  <html>
    <body style="margin:0;padding:0;background:#0c0a08;font-family:Arial,sans-serif;color:#f7ead6;">
      <div style="max-width:640px;margin:0 auto;padding:24px;">
        <div style="padding:18px 20px;border-radius:16px;background:linear-gradient(180deg,#1b120c,#0f0b08);border:1px solid #3a2a1d;">
          <div style="font-size:18px;font-weight:700;letter-spacing:0.6px;">${title}</div>
          ${subtitleLine}
        </div>
        <div style="margin-top:16px;padding:18px;border-radius:16px;background:#14100c;border:1px solid #3a2a1d;">
          ${input.bodyHtml}
        </div>
        <div style="margin-top:16px;color:#bfa98b;font-size:12px;">
          <div>${label}</div>
          <div>${link}</div>
        </div>
      </div>
    </body>
  </html>
  `;
}
