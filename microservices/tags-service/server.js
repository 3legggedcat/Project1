const http = require("http");
const path = require("path");
const { getJsonBody, methodNotAllowed, notFound, sendEmpty, sendJson } = require("../shared/http");
const { ensureJsonFile, readJsonFile, writeJsonFile } = require("../shared/storage");

const PORT = Number(process.env.PORT || 6003);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "tags.json");

ensureJsonFile(DATA_FILE, []);

const createId = () => `tag_${Math.random().toString(36).slice(2, 10)}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { service: "tags-service", status: "ok" });
    return;
  }

  if (url.pathname !== "/tags") {
    notFound(res);
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, readJsonFile(DATA_FILE, []));
    return;
  }

  if (req.method === "POST") {
    try {
      const { name = "", color = "#2563eb" } = await getJsonBody(req);
      const trimmedName = name.trim();
      const trimmedColor = color.trim() || "#2563eb";

      if (!trimmedName) {
        sendJson(res, 400, { message: "Tag name is required." });
        return;
      }

      const tags = readJsonFile(DATA_FILE, []);
      if (tags.some(tag => tag.name.toLowerCase() === trimmedName.toLowerCase())) {
        sendJson(res, 409, { message: "Tag already exists." });
        return;
      }

      const tag = {
        id: createId(),
        name: trimmedName,
        color: trimmedColor,
        createdAt: new Date().toISOString(),
      };

      tags.push(tag);
      writeJsonFile(DATA_FILE, tags);
      sendJson(res, 201, tag);
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  methodNotAllowed(res);
});

server.listen(PORT, () => {
  console.log(`tags-service listening on ${PORT}`);
});
