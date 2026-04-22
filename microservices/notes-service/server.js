const http = require("http");
const path = require("path");
const { getJsonBody, methodNotAllowed, notFound, sendEmpty, sendJson } = require("../shared/http");
const { ensureJsonFile, readJsonFile, writeJsonFile } = require("../shared/storage");

const PORT = Number(process.env.PORT || 6002);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "notes.json");

ensureJsonFile(DATA_FILE, []);

const createId = () => `nte_${Math.random().toString(36).slice(2, 10)}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { service: "notes-service", status: "ok" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/notes") {
    sendJson(res, 200, readJsonFile(DATA_FILE, []));
    return;
  }

  if (req.method === "POST" && url.pathname === "/notes") {
    try {
      const { title = "", content = "", userId = "", tagIds = [] } = await getJsonBody(req);
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();
      const normalizedTagIds = Array.isArray(tagIds)
        ? tagIds.map(tagId => String(tagId).trim()).filter(Boolean)
        : [];

      if (!trimmedTitle || !trimmedContent || !String(userId).trim()) {
        sendJson(res, 400, { message: "Title, content, and userId are required." });
        return;
      }

      const notes = readJsonFile(DATA_FILE, []);
      const note = {
        id: createId(),
        title: trimmedTitle,
        content: trimmedContent,
        userId: String(userId).trim(),
        tagIds: normalizedTagIds,
        createdAt: new Date().toISOString(),
      };

      notes.unshift(note);
      writeJsonFile(DATA_FILE, notes);
      sendJson(res, 201, note);
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/notes/")) {
    const noteId = url.pathname.split("/")[2];
    const notes = readJsonFile(DATA_FILE, []);
    const nextNotes = notes.filter(note => note.id !== noteId);

    if (nextNotes.length === notes.length) {
      sendJson(res, 404, { message: "Note not found." });
      return;
    }

    writeJsonFile(DATA_FILE, nextNotes);
    sendJson(res, 200, { message: "Note deleted." });
    return;
  }

  notFound(res);
});

server.listen(PORT, () => {
  console.log(`notes-service listening on ${PORT}`);
});
