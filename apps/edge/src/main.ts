import http, { type IncomingHttpHeaders, type RequestOptions } from "node:http";
import { loadConfig } from "@frameworkx/shared";

const config = loadConfig(process.cwd());
const edgePort = Number(process.env.FRAMEWORKX_EDGE_PORT ?? 5080);
const uiHost = process.env.FRAMEWORKX_UI_HOST ?? "127.0.0.1";
const apiHost = process.env.FRAMEWORKX_API_HOST ?? "127.0.0.1";
const requestTimeoutMs = Number(process.env.FRAMEWORKX_EDGE_TIMEOUT_MS ?? 120_000);

function buildTarget(pathname: string) {
  const isApi = pathname.startsWith("/api") || pathname === "/health";
  return {
    host: isApi ? apiHost : uiHost,
    port: isApi ? config.apiPort : config.uiPort,
    isApi
  };
}

function sanitizeHeaders(headers: IncomingHttpHeaders, hostHeader: string): IncomingHttpHeaders {
  const out: IncomingHttpHeaders = { ...headers };
  out.host = hostHeader;
  out["x-forwarded-proto"] = String(headers["x-forwarded-proto"] ?? "https");
  const currentForwardedFor = String(headers["x-forwarded-for"] ?? "").trim();
  const remote = String(headers["x-real-ip"] ?? "").trim();
  if (remote) {
    out["x-forwarded-for"] = currentForwardedFor ? `${currentForwardedFor}, ${remote}` : remote;
  }
  return out;
}

const server = http.createServer((req, res) => {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";

  if (url === "/edge/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", edge: true }));
    return;
  }

  const target = buildTarget(url);
  const proxyHeaders = sanitizeHeaders(req.headers, `${target.host}:${target.port}`);
  const options: RequestOptions = {
    host: target.host,
    port: target.port,
    method,
    path: url,
    headers: proxyHeaders
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const statusCode = proxyRes.statusCode ?? 502;
    const headers = { ...proxyRes.headers };
    res.writeHead(statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.setTimeout(requestTimeoutMs, () => {
    proxyReq.destroy(new Error("upstream_timeout"));
  });

  proxyReq.on("error", () => {
    if (res.headersSent) {
      res.end();
      return;
    }
    res.writeHead(502, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: "bad_gateway",
        upstream: target.isApi ? "api" : "ui"
      })
    );
  });

  req.pipe(proxyReq);
});

server.listen(edgePort, "0.0.0.0", () => {
  console.log(`frameworkx-edge listening on 0.0.0.0:${edgePort} -> api:${config.apiPort}, ui:${config.uiPort}`);
});
