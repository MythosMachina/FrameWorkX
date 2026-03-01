import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { loadConfig } from "@frameworkx/shared";
import { registerMessageRoutes } from "./routes/messages.js";
import { registerInteractionRoutes } from "./routes/interactions.js";
import { registerFollowRoutes } from "./routes/follows.js";

const config = loadConfig(process.cwd());

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: config.installKey });

await registerMessageRoutes(app);
await registerInteractionRoutes(app);
await registerFollowRoutes(app);

app.get("/health", async () => ({ status: "ok", service: "social" }));

app.listen({ host: "127.0.0.1", port: config.socialPort });
