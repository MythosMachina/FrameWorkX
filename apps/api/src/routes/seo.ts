import type { FastifyInstance } from "fastify";
import { query } from "@frameworkx/shared";

function escapeXml(input: string) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeIsoDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

export async function registerSeoRoutes(app: FastifyInstance) {
  app.get("/api/seo/sitemap.xml", async (_request, reply) => {
    const baseUrl = "https://frameworkx.lenz-service.de";

    const images = await query<{ id: string; created_at: string }>(
      `SELECT i.id, i.created_at
       FROM gallery.images i
       WHERE i.is_public = true
         AND NOT EXISTS (
           SELECT 1
           FROM gallery.nsfw_tags t
           WHERE COALESCE(i.prompt, '') ILIKE '%' || t.tag || '%'
         )
       ORDER BY i.created_at DESC
       LIMIT 5000`
    );

    const loras = await query<{ id: string; created_at: string }>(
      `SELECT l.id, l.created_at
       FROM gallery.loras l
       WHERE l.is_public = true
       ORDER BY l.created_at DESC
       LIMIT 5000`
    );

    const latestContentDate = [images[0]?.created_at, loras[0]?.created_at]
      .map((value) => new Date(value ?? 0).getTime())
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a)[0];
    const latestIso = Number.isFinite(latestContentDate) ? new Date(latestContentDate).toISOString() : null;

    const urls: Array<{ loc: string; changefreq?: string; priority?: string; lastmod?: string | null }> = [
      { loc: `${baseUrl}/`, changefreq: "hourly", priority: "1.0", lastmod: latestIso }
    ];

    for (const row of loras) {
      const lastmod = normalizeIsoDate(row.created_at);
      urls.push({
        loc: `${baseUrl}/?lora=${encodeURIComponent(row.id)}`,
        changefreq: "daily",
        priority: "0.8",
        lastmod
      });
    }

    for (const row of images) {
      const lastmod = normalizeIsoDate(row.created_at);
      urls.push({
        loc: `${baseUrl}/?image=${encodeURIComponent(row.id)}`,
        changefreq: "daily",
        priority: "0.7",
        lastmod
      });
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((entry) => {
        const lines = [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`];
        if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
        if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
        if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
        lines.push("  </url>");
        return lines.join("\n");
      }),
      "</urlset>"
    ].join("\n");

    reply.header("Content-Type", "application/xml; charset=utf-8");
    reply.send(xml);
  });
}
