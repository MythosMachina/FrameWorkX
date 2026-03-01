import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { loadConfig, query } from "@frameworkx/shared";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerSettingsRoutes } from "./routes/settings.js";
import { registerQueueRoutes } from "./routes/queue.js";
import { registerPipelineRoutes } from "./routes/pipeline.js";
import { registerGenerationRoutes } from "./routes/generation.js";
import { registerTrainingRoutes } from "./routes/training.js";
import { registerModelRegistryRoutes } from "./routes/model_registry.js";
import { registerGalleryRoutes } from "./routes/gallery.js";
import { registerLoraRoutes } from "./routes/loras.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerTaggerRoutes } from "./routes/tagger.js";
import { registerApplicationRoutes } from "./routes/applications.js";
import { registerDashboardRoutes } from "./routes/dashboard.js";
import { registerStyleRoutes } from "./routes/styles.js";
import { registerArchiveRoutes } from "./routes/archives.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerMessageRoutes } from "./routes/messages.js";
import { registerSeoRoutes } from "./routes/seo.js";

const config = loadConfig(process.cwd());
const SOCIAL_PROXY_PATTERNS = [
  /^\/api\/dm(?:\/|$)/,
  /^\/api\/gallery\/images\/[^/]+\/(?:comments(?:\/[^/]+)?|like)$/,
  /^\/api\/gallery\/models\/[^/]+\/(?:comments(?:\/[^/]+)?|like)$/,
  /^\/api\/loras\/[^/]+\/(?:comments(?:\/[^/]+)?|like)$/,
  /^\/api\/users\/[^/]+\/follow$/
];

const socialProxyState = {
  lastReadAt: 0,
  enabled: false
};

function parseBooleanFlag(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  }
  return fallback;
}

async function isSocialProxyEnabled() {
  if (process.env.FRAMEWORKX_SOCIAL_SERVICE_ENABLED != null) {
    return parseBooleanFlag(process.env.FRAMEWORKX_SOCIAL_SERVICE_ENABLED, false);
  }
  const now = Date.now();
  if (now - socialProxyState.lastReadAt < 3000) {
    return socialProxyState.enabled;
  }
  const [row] = await query<{ value: unknown }>(
    "SELECT value FROM core.settings WHERE scope = 'global' AND scope_id IS NULL AND key = 'social.service.enabled' LIMIT 1"
  );
  socialProxyState.enabled = parseBooleanFlag(row?.value, false);
  socialProxyState.lastReadAt = now;
  return socialProxyState.enabled;
}

function socialProxyBaseUrl() {
  const raw = String(process.env.FRAMEWORKX_SOCIAL_BASE_URL ?? "").trim();
  if (raw) return raw.replace(/\/+$/, "");
  return `http://127.0.0.1:${config.socialPort}`;
}

function isSocialProxyPath(pathname: string) {
  return SOCIAL_PROXY_PATTERNS.some((pattern) => pattern.test(pathname));
}

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024
  }
});
await app.register(jwt, { secret: config.installKey });

app.addHook("preHandler", async (request: any, reply) => {
  const method = String(request.method ?? "GET").toUpperCase();
  if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) return;
  const rawUrl = String(request.raw?.url ?? "");
  const pathname = rawUrl.split("?")[0] || "/";
  if (!isSocialProxyPath(pathname)) return;
  if (!(await isSocialProxyEnabled())) return;

  const target = `${socialProxyBaseUrl()}${rawUrl}`;
  const headers: Record<string, string> = {};
  const auth = String(request.headers?.authorization ?? "").trim();
  if (auth) headers.authorization = auth;
  if (["POST", "PATCH", "DELETE"].includes(method)) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(target, {
      method,
      headers,
      body:
        ["POST", "PATCH", "DELETE"].includes(method) && request.body !== undefined
          ? JSON.stringify(request.body)
          : undefined
    });
  } catch {
    reply.code(502).send({ error: "social_service_unreachable" });
    return;
  }

  reply.code(response.status);
  const contentType = String(response.headers.get("content-type") ?? "");
  if (contentType.includes("application/json")) {
    reply.send(await response.json());
    return;
  }
  reply.type(contentType || "text/plain").send(await response.text());
});

await registerAuthRoutes(app);
await registerUserRoutes(app);
await registerSettingsRoutes(app);
await registerQueueRoutes(app);
await registerPipelineRoutes(app);
await registerGenerationRoutes(app);
await registerTrainingRoutes(app);
await registerModelRegistryRoutes(app);
await registerGalleryRoutes(app);
await registerLoraRoutes(app);
await registerFileRoutes(app);
await registerStyleRoutes(app);
await registerTaggerRoutes(app);
await registerApplicationRoutes(app);
await registerDashboardRoutes(app);
await registerArchiveRoutes(app);
await registerNotificationRoutes(app);
await registerMessageRoutes(app);
await registerSeoRoutes(app);

app.get("/health", async () => ({ status: "ok" }));

app.listen({ host: "0.0.0.0", port: config.apiPort });
