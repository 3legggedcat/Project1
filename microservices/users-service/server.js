const http = require("http");
const path = require("path");
const { getJsonBody, methodNotAllowed, notFound, sendEmpty, sendJson } = require("../shared/http");
const { ensureJsonFile, readJsonFile, writeJsonFile } = require("../shared/storage");

const PORT = Number(process.env.PORT || 6001);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "users.json");

ensureJsonFile(DATA_FILE, []);

const createId = () => `usr_${Math.random().toString(36).slice(2, 10)}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { service: "users-service", status: "ok" });
    return;
  }

  if (url.pathname !== "/users") {
    notFound(res);
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, readJsonFile(DATA_FILE, []));
    return;
  }

  if (req.method === "POST") {
    try {
      const { name = "", email = "" } = await getJsonBody(req);
      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();

      if (!trimmedName || !normalizedEmail) {
        sendJson(res, 400, { message: "Name and email are required." });
        return;
      }

      const users = readJsonFile(DATA_FILE, []);
      if (users.some(user => user.email === normalizedEmail)) {
        sendJson(res, 409, { message: "A user with that email already exists." });
        return;
      }

      const user = {
        id: createId(),
        name: trimmedName,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
      };

      users.push(user);
      writeJsonFile(DATA_FILE, users);
      sendJson(res, 201, user);
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  methodNotAllowed(res);
});

server.listen(PORT, () => {
  console.log(`users-service listening on ${PORT}`);
});
