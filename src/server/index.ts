import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { discoverCodexSessions, readCodexSessionByKey } from "../codexSession/discovery.js";

const port = Number(process.env.PORT ?? 4174);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const clientRoot = path.join(projectRoot, "dist", "client");

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (url.pathname === "/api/sessions") {
    try {
      const result = await discoverCodexSessions(discoveryOptionsFromUrl(url));
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, {
        sessions: [],
        warnings: [error instanceof Error ? error.message : "Unknown discovery error"]
      });
    }
    return;
  }

  if (url.pathname.startsWith("/api/sessions/")) {
    const key = decodeURIComponent(url.pathname.replace("/api/sessions/", ""));
    try {
      const result = await readCodexSessionByKey(key, discoveryOptionsFromUrl(url));
      if (!result) {
        sendJson(response, 404, { message: "Session not found" });
        return;
      }
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, {
        message: error instanceof Error ? error.message : "Unknown session read error"
      });
    }
    return;
  }

  await serveClient(url.pathname, response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dev Journal server listening on http://127.0.0.1:${port}`);
});

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function discoveryOptionsFromUrl(url: URL) {
  const historyPath = url.searchParams.get("historyPath")?.trim();
  return historyPath ? { historyPath } : {};
}

async function serveClient(pathname: string, response: ServerResponse) {
  const normalizedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.join(clientRoot, normalizedPath);

  if (!filePath.startsWith(clientRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    await readFile(filePath);
    response.writeHead(200, { "content-type": contentType(filePath) });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    createReadStream(path.join(clientRoot, "index.html")).pipe(response);
  }
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
