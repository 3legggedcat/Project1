const fs = require("fs");
const http = require("http");
const path = require("path");
const { getJsonBody, notFound, sendEmpty, sendJson } = require("../shared/http");

const PORT = Number(process.env.PORT || 6100);
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:6001";
const NOTES_SERVICE_URL = process.env.NOTES_SERVICE_URL || "http://localhost:6002";
const TAGS_SERVICE_URL = process.env.TAGS_SERVICE_URL || "http://localhost:6003";
const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || "http://localhost:6004";
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
};

const serviceMap = {
  "/api/users": USERS_SERVICE_URL,
  "/api/notes": NOTES_SERVICE_URL,
  "/api/tags": TAGS_SERVICE_URL,
  "/api/weather": WEATHER_SERVICE_URL,
};

const proxyRequest = async (req, res, baseUrl) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = new URL(url.pathname.replace("/api", "") + url.search, baseUrl);

  const options = {
    method: req.method,
    headers: {},
  };

  if (req.headers["content-type"]) {
    options.headers["content-type"] = req.headers["content-type"];
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await getJsonBody(req);
    options.body = JSON.stringify(body);
    options.headers["content-type"] = "application/json";
  }

  const response = await fetch(targetUrl, options);
  const text = await response.text();

  res.writeHead(response.status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": response.headers.get("content-type") || "application/json; charset=UTF-8",
  });
  res.end(text);
};

const fetchJson = async url => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }
  return response.json();
};

const serveStaticFile = (req, res) => {
  const resourcePath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(decodeURIComponent(resourcePath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(FRONTEND_DIR, safePath);

  if (!filePath.startsWith(FRONTEND_DIR)) {
    notFound(res);
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      notFound(res);
      return;
    }

    const extension = path.extname(filePath);
    const type = MIME_TYPES[extension] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { service: "api-gateway", status: "ok" });
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js")) {
    serveStaticFile(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/dashboard") {
    try {
      const city = url.searchParams.get("city") || "phoenix";
      const [users, notes, tags, weather] = await Promise.all([
        fetchJson(`${USERS_SERVICE_URL}/users`),
        fetchJson(`${NOTES_SERVICE_URL}/notes`),
        fetchJson(`${TAGS_SERVICE_URL}/tags`),
        fetchJson(`${WEATHER_SERVICE_URL}/weather?city=${encodeURIComponent(city)}`),
      ]);

      sendJson(res, 200, {
        summary: {
          totalUsers: users.length,
          totalNotes: notes.length,
          totalTags: tags.length,
        },
        users,
        notes,
        tags,
        weather,
      });
    } catch (error) {
      sendJson(res, 502, { message: "Unable to build dashboard response.", detail: error.message });
    }
    return;
  }

  const matchedRoute = Object.keys(serviceMap).find(prefix => url.pathname.startsWith(prefix));
  if (!matchedRoute) {
    notFound(res);
    return;
  }

  try {
    await proxyRequest(req, res, serviceMap[matchedRoute]);
  } catch (error) {
    sendJson(res, 502, { message: "Upstream service unavailable.", detail: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`api-gateway listening on ${PORT}`);
});
