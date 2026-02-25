import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { loadConfig } from "@frameworkx/shared";
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

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024
  }
});
await app.register(jwt, { secret: config.installKey });

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
