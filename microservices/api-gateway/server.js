const http = require("http");
const { getJsonBody, notFound, sendEmpty, sendJson } = require("../shared/http");

const PORT = Number(process.env.PORT || 6100);
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:6001";
const NOTES_SERVICE_URL = process.env.NOTES_SERVICE_URL || "http://localhost:6002";
const TAGS_SERVICE_URL = process.env.TAGS_SERVICE_URL || "http://localhost:6003";
const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || "http://localhost:6004";

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
