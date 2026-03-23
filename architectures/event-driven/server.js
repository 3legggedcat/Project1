const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventBus } = require('./event-bus');
const { EventStore } = require('./event-store');
const { NoteProjection } = require('./note-projection');
const { NoteService } = require('./note-service');

const PORT = Number(process.env.PORT || 5603);

const eventBus = new EventBus();
const eventStore = new EventStore();
const noteProjection = new NoteProjection(eventBus);
const noteService = new NoteService({ eventBus, eventStore, noteProjection });

const MIME_TYPES = {
  '.css': 'text/css; charset=UTF-8',
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
};

const parseBody = req =>
  new Promise((resolve, reject) => {
    let data = '';
    req
      .on('data', chunk => {
        data += chunk;
      })
      .on('end', () => {
        if (!data) {
          resolve({});
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON payload.'));
        }
      })
      .on('error', reject);
  });

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(payload));
};

const serveFile = (res, fileName) => {
  const filePath = path.join(__dirname, 'public', fileName);
  const ext = path.extname(filePath);
  const type = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/') {
    serveFile(res, 'index.html');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/app.js') {
    serveFile(res, 'app.js');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/styles.css') {
    serveFile(res, 'styles.css');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/notes') {
    sendJson(res, 200, noteProjection.getAll());
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    sendJson(res, 200, eventStore.getAll());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/commands/create-note') {
    try {
      const body = await parseBody(req);
      const note = noteService.createNote(body);
      sendJson(res, 201, {
        id: note.id,
        name: note.name,
        content: note.content,
        createdAt: note.createdAt,
        requiresPassword: Boolean(note.password),
      });
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/commands/delete-note') {
    try {
      const body = await parseBody(req);
      noteService.deleteNote(body);
      sendJson(res, 200, { message: 'Note deleted.' });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { message: error.message });
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Event-driven notes server listening on http://localhost:${PORT}`);
});
