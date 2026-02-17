const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const notes = [];

const MIME_TYPES = {
  '.css': 'text/css; charset=UTF-8',
  '.html': 'text/html; charset=UTF-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
};

const createId = () => Math.random().toString(36).slice(2, 10);

const sendJSON = (res, status, payload = {}) => {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Content-Type': 'application/json; charset=UTF-8',
  });
  res.end(JSON.stringify(payload));
};

const getBody = req =>
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
        } catch (err) {
          reject(new Error('Invalid JSON'));
        }
      })
      .on('error', reject);
  });

const serveFile = (req, res) => {
  const resource = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, decodeURIComponent(resource));
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/notes')) {
    if (req.method === 'OPTIONS') {
      sendJSON(res, 204, {});
      return;
    }

    try {
      if (req.method === 'GET' && url.pathname === '/api/notes') {
        sendJSON(res, 200, notes);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/notes') {
        const { name = 'Anonymous', content = '', password = '' } = await getBody(req);
        const trimmed = content.trim();
        if (!trimmed) {
          sendJSON(res, 400, { message: 'Note content is required.' });
          return;
        }

        const note = {
          id: createId(),
          name: name.trim() || 'Anonymous',
          content: trimmed,
          password: password.trim(),
          createdAt: new Date().toISOString(),
        };

        notes.unshift(note);
        sendJSON(res, 201, note);
        return;
      }

      if (req.method === 'DELETE') {
        const noteId = url.pathname.split('/')[3];
        if (!noteId) {
          sendJSON(res, 400, { message: 'Note ID required.' });
          return;
        }

        const { password = '' } = await getBody(req);
        const index = notes.findIndex(note => note.id === noteId);

        if (index === -1) {
          sendJSON(res, 404, { message: 'Note not found.' });
          return;
        }

        const note = notes[index];
        if (note.password && note.password !== password) {
          sendJSON(res, 403, { message: 'Incorrect password.' });
          return;
        }

        notes.splice(index, 1);
        sendJSON(res, 200, { message: 'Note deleted.' });
        return;
      }

      sendJSON(res, 405, { message: 'Method not allowed.' });
    } catch (error) {
      sendJSON(res, 400, { message: error.message });
    }
    return;
  }

  serveFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
