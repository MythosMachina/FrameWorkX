import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  FRAMEWORKX_DATABASE_URL: z.string().min(1),
  FRAMEWORKX_STORAGE_ROOT: z.string().optional(),
  FRAMEWORKX_INSTALL_KEY: z.string().min(8),
  FRAMEWORKX_API_PORT: z.string().optional(),
  FRAMEWORKX_WORKER_PORT: z.string().optional(),
  FRAMEWORKX_INDEXER_PORT: z.string().optional(),
  FRAMEWORKX_UI_PORT: z.string().optional(),
  FRAMEWORKX_SOCIAL_PORT: z.string().optional()
});

export type AppConfig = {
  databaseUrl: string;
  storageRoot: string;
  installKey: string;
  apiPort: number;
  workerPort: number;
  indexerPort: number;
  uiPort: number;
  socialPort: number;
};

export function loadConfig(cwd = process.cwd()): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  const env = parsed.data;
  const storageRoot = env.FRAMEWORKX_STORAGE_ROOT
    ? path.resolve(env.FRAMEWORKX_STORAGE_ROOT)
    : path.resolve(cwd, "storage");

  return {
    databaseUrl: env.FRAMEWORKX_DATABASE_URL,
    storageRoot,
    installKey: env.FRAMEWORKX_INSTALL_KEY,
    apiPort: Number(env.FRAMEWORKX_API_PORT ?? 4100),
    workerPort: Number(env.FRAMEWORKX_WORKER_PORT ?? 4200),
    indexerPort: Number(env.FRAMEWORKX_INDEXER_PORT ?? 4300),
    uiPort: Number(env.FRAMEWORKX_UI_PORT ?? 5173),
    socialPort: Number(env.FRAMEWORKX_SOCIAL_PORT ?? 4400)
  };
}
