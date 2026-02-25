import nodemailer from "nodemailer";
import { decryptWithKey, loadConfig, query } from "@frameworkx/shared";

type MailSettings = {
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_ssl?: boolean;
  smtp_tls?: boolean;
  smtp_from?: string;
  smtp_base_url?: string;
  instance_label?: string;
  instance_url?: string;
};

const config = loadConfig(process.cwd());

export async function loadMailSettings() {
  const rows = await query<{ key: string; value: any }>(
    `SELECT DISTINCT ON (key) key, value
     FROM core.settings
     WHERE scope='global'
       AND key IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ORDER BY key, updated_at DESC, created_at DESC`,
    [
      "smtp_host",
      "smtp_port",
      "smtp_user",
      "smtp_pass",
      "smtp_ssl",
      "smtp_tls",
      "smtp_from",
      "smtp_base_url",
      "instance_label",
      "instance_url"
    ]
  );
  const map: MailSettings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const smtpPassValue = map.smtp_pass as any;
  if (smtpPassValue && typeof smtpPassValue === "object" && smtpPassValue.encrypted && smtpPassValue.value) {
    map.smtp_pass = decryptWithKey(config.installKey, smtpPassValue.value);
  }
  return map;
}

export async function sendMail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const settings = await loadMailSettings();
  const host = String(settings.smtp_host ?? "");
  const port = Number(settings.smtp_port ?? 0);
  const from = String(settings.smtp_from ?? "");
  if (!host || !port || !from) {
    return { error: "smtp_not_configured" };
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: Boolean(settings.smtp_ssl ?? false),
    requireTLS: Boolean(settings.smtp_tls ?? false),
    auth: settings.smtp_user ? { user: settings.smtp_user, pass: settings.smtp_pass } : undefined
  });
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
  return { status: "ok" };
}
