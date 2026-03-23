const http = require('http');

const PORT = Number(process.env.PORT || 5601);
const notes = [];

const createId = () => Math.random().toString(36).slice(2, 10);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monolithic Notes</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="layout">
    <section class="panel">
      <h1>Monolithic Notes</h1>
      <p>All presentation, request handling, and note state live in one Node.js application.</p>
      <form id="note-form">
        <label for="name">Name</label>
        <input id="name" name="name" type="text" placeholder="Anonymous">

        <label for="content">Note</label>
        <textarea id="content" name="content" placeholder="Write a note" required></textarea>

        <label for="password">Deletion password</label>
        <input id="password" name="password" type="password" placeholder="Optional password">

        <button type="submit">Save Note</button>
      </form>
    </section>

    <section class="panel">
      <h2>Saved Notes</h2>
      <ul id="notes-list"></ul>
    </section>
  </main>
  <script src="/app.js"></script>
</body>
</html>`;

const css = ``;

const clientJs = `
const form = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');
let notes = [];

const render = () => {
  notesList.innerHTML = '';
  if (!notes.length) {
    const item = document.createElement('li');
    item.className = 'empty';
    item.textContent = 'No notes yet.';
    notesList.appendChild(item);
    return;
  }

  notes.forEach(note => {
    const item = document.createElement('li');
    const meta = document.createElement('div');
    meta.className = 'note-meta';

    const author = document.createElement('strong');
    author.textContent = note.name;

    const timestamp = document.createElement('span');
    timestamp.textContent = new Date(note.createdAt).toLocaleString();

    const content = document.createElement('p');
    content.textContent = note.content;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Delete';
    button.addEventListener('click', async () => {
      let password = '';
      if (note.requiresPassword) {
        const value = window.prompt('Enter the password for this note:');
        if (value === null) return;
        password = value;
      }

      const response = await fetch('/api/notes/' + note.id, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        window.alert(error.message);
        return;
      }

      await loadNotes();
    });

    meta.appendChild(author);
    meta.appendChild(timestamp);
    item.appendChild(meta);
    item.appendChild(content);
    item.appendChild(button);
    notesList.appendChild(item);
  });
};

const loadNotes = async () => {
  const response = await fetch('/api/notes');
  notes = await response.json();
  render();
};

form.addEventListener('submit', async event => {
  event.preventDefault();

  const payload = {
    name: form.name.value.trim() || 'Anonymous',
    content: form.content.value.trim(),
    password: form.password.value.trim(),
  };

  if (!payload.content) {
    window.alert('Note content is required.');
    return;
  }

  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    window.alert(error.message);
    return;
  }

  form.reset();
  await loadNotes();
});

loadNotes();
`;

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

const send = (res, status, type, body) => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
};

const sendJson = (res, status, payload) => {
  send(res, status, 'application/json; charset=UTF-8', JSON.stringify(payload));
};

const serializeNote = note => ({
  id: note.id,
  name: note.name,
  content: note.content,
  createdAt: note.createdAt,
  requiresPassword: Boolean(note.password),
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/') {
    send(res, 200, 'text/html; charset=UTF-8', html);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/styles.css') {
    send(res, 200, 'text/css; charset=UTF-8', css);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/app.js') {
    send(res, 200, 'text/javascript; charset=UTF-8', clientJs);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/notes') {
    sendJson(res, 200, notes.map(serializeNote));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/notes') {
    try {
      const body = await parseBody(req);
      const content = (body.content || '').trim();
      if (!content) {
        sendJson(res, 400, { message: 'Note content is required.' });
        return;
      }

      const note = {
        id: createId(),
        name: (body.name || '').trim() || 'Anonymous',
        content,
        password: (body.password || '').trim(),
        createdAt: new Date().toISOString(),
      };

      notes.unshift(note);
      sendJson(res, 201, serializeNote(note));
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/notes/')) {
    try {
      const noteId = url.pathname.split('/').pop();
      const body = await parseBody(req);
      const index = notes.findIndex(note => note.id === noteId);

      if (index === -1) {
        sendJson(res, 404, { message: 'Note not found.' });
        return;
      }

      if (notes[index].password && notes[index].password !== (body.password || '')) {
        sendJson(res, 403, { message: 'Incorrect password.' });
        return;
      }

      notes.splice(index, 1);
      sendJson(res, 200, { message: 'Note deleted.' });
    } catch (error) {
      sendJson(res, 400, { message: error.message });
    }
    return;
  }

  send(res, 404, 'text/plain; charset=UTF-8', 'Not Found');
});

server.listen(PORT, () => {
  console.log('Monolithic notes server listening on http://localhost:' + PORT);
});
