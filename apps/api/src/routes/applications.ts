import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { execute, query, randomToken } from "@frameworkx/shared";
import { loadMailSettings, sendMail } from "../lib/mailer.js";
import { renderApprovedEmail, renderRejectedEmail } from "../templates/email_templates.js";

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    throw new Error("unauthorized");
  }
}

async function requireAdmin(request: any, reply: any) {
  await requireAuth(request, reply);
  const roleId = request.user.role_id as string;
  const [role] = await query<{ name: string }>("SELECT name FROM core.roles WHERE id = $1", [roleId]);
  if (role?.name !== "admin") {
    reply.code(403);
    throw new Error("forbidden");
  }
}

export async function registerApplicationRoutes(app: FastifyInstance) {
  app.post("/api/applications", async (request: any, reply) => {
    const body = request.body as {
      email?: string;
      display_name?: string;
      handle?: string;
      links?: string;
      message?: string;
    };
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    if (!email || !message) {
      reply.code(400);
      return { error: "missing_fields" };
    }
    await execute(
      "INSERT INTO core.applications (id, email, display_name, handle, links, message) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        randomUUID(),
        email,
        body.display_name ? String(body.display_name).trim() : null,
        body.handle ? String(body.handle).trim() : null,
        body.links ? String(body.links).trim() : null,
        message
      ]
    );
    return { status: "ok" };
  });

  app.get("/api/admin/applications", { preHandler: requireAdmin }, async () => {
    const rows = await query(
      `SELECT id,
              email,
              display_name,
              handle,
              links,
              message,
              status,
              reviewed_by,
              reviewed_at,
              review_note,
              created_at
       FROM core.applications
       ORDER BY created_at DESC`
    );
    return { applications: rows };
  });

  app.put("/api/admin/applications/:id", { preHandler: requireAdmin }, async (request: any, reply) => {
    const id = (request.params as { id: string }).id;
    const body = request.body as { status?: string; review_note?: string };
    const status = body.status ? String(body.status).toLowerCase() : "";
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      reply.code(400);
      return { error: "invalid_status" };
    }
    const [application] = await query<{
      id: string;
      email: string;
      display_name: string | null;
      handle: string | null;
      links: string | null;
    }>("SELECT id, email, display_name, handle, links FROM core.applications WHERE id = $1", [id]);
    if (!application) {
      reply.code(404);
      return { error: "not_found" };
    }
    const settings = await loadMailSettings();
    const baseUrl = String(settings.smtp_base_url ?? settings.instance_url ?? "");

    let mailError: string | null = null;
    if (status === "approved") {
      if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_from) {
        reply.code(400);
        return { error: "smtp_not_configured" };
      }
      const existing = await query("SELECT id FROM core.users WHERE email = $1 OR username = $2", [
        application.email,
        application.handle ?? ""
      ]);
      if (existing.length) {
        reply.code(409);
        return { error: "user_exists" };
      }
      const [role] = await query<{ id: string }>("SELECT id FROM core.roles WHERE name = 'member'");
      const tempPassword = randomToken(12);
      const hash = await argon2.hash(tempPassword, { type: argon2.argon2id });

      let username = application.handle?.trim() || application.email.split("@")[0];
      if (!username) username = `user_${application.id.slice(0, 6)}`;
      let suffix = 1;
      while (
        (await query("SELECT id FROM core.users WHERE username = $1", [username])).length > 0 &&
        suffix < 50
      ) {
        username = `${username}_${suffix}`;
        suffix += 1;
      }

      const userId = randomUUID();
      await execute(
        "INSERT INTO core.users (id, email, username, password_hash, role_id, must_change_password) VALUES ($1,$2,$3,$4,$5,true)",
        [userId, application.email, username, hash, role?.id ?? null]
      );
      await execute(
        "INSERT INTO core.credits (user_id, balance, daily_allowance, credits_reserved) VALUES ($1,0,0,0)",
        [userId]
      );

      const loginUrl = baseUrl ? `${baseUrl}/login` : "";
      const email = renderApprovedEmail({
        username,
        tempPassword,
        loginUrl,
        instanceLabel: settings.instance_label ?? "",
        instanceUrl: settings.instance_url ?? ""
      });
      try {
        await sendMail({ to: application.email, subject: email.subject, text: email.text, html: email.html });
      } catch (err) {
        request.log.error({ err }, "mail_send_failed");
        mailError = "mail_send_failed";
      }
    }

    if (status === "rejected") {
      if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_from) {
        reply.code(400);
        return { error: "smtp_not_configured" };
      }
      const email = renderRejectedEmail({
        loginUrl: baseUrl ? `${baseUrl}/login` : "",
        instanceLabel: settings.instance_label ?? "",
        instanceUrl: settings.instance_url ?? ""
      });
      try {
        await sendMail({ to: application.email, subject: email.subject, text: email.text, html: email.html });
      } catch (err) {
        request.log.error({ err }, "mail_send_failed");
        mailError = "mail_send_failed";
      }
    }

    await execute(
      "UPDATE core.applications SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4",
      [status, body.review_note ?? null, request.user.sub, id]
    );
    return { status: "ok", mail_error: mailError };
  });

  app.delete("/api/admin/applications/:id", { preHandler: requireAdmin }, async (request: any, reply) => {
    const id = (request.params as { id: string }).id;
    const [row] = await query<{ status: string }>("SELECT status FROM core.applications WHERE id = $1", [id]);
    if (!row) {
      reply.code(404);
      return { error: "not_found" };
    }
    if (row.status !== "rejected") {
      reply.code(409);
      return { error: "cannot_delete_unless_rejected" };
    }
    await execute("DELETE FROM core.applications WHERE id = $1", [id]);
    return { status: "ok" };
  });
}
