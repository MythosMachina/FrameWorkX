import type { FastifyInstance } from "fastify";
import { presetStylePublic } from "../styles/presets.js";

export async function registerStyleRoutes(app: FastifyInstance) {
  app.get("/api/styles", async () => {
    return { styles: presetStylePublic };
  });
}
