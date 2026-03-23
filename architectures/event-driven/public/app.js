const form = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');

const render = notes => {
  notesList.innerHTML = '';
  if (!notes.length) {
    const item = document.createElement('li');
    item.className = 'empty';
    item.textContent = 'No projected notes yet.';
    notesList.appendChild(item);
    return;
  }

  notes.forEach(note => {
    const item = document.createElement('li');

    const row = document.createElement('div');
    row.className = 'note-meta';

    const title = document.createElement('strong');
    title.textContent = note.name;

    const time = document.createElement('span');
    time.textContent = new Date(note.createdAt).toLocaleString();

    const content = document.createElement('p');
    content.textContent = note.content;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Publish Delete Command';
    button.addEventListener('click', async () => {
      let password = '';
      if (note.requiresPassword) {
        const value = window.prompt('Enter the password for this note:');
        if (value === null) return;
        password = value;
      }

      const response = await fetch('/api/commands/delete-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        window.alert(error.message);
        return;
      }

      await loadNotes();
    });

    row.appendChild(title);
    row.appendChild(time);
    item.appendChild(row);
    item.appendChild(content);
    item.appendChild(button);
    notesList.appendChild(item);
  });
};

const loadNotes = async () => {
  const response = await fetch('/api/notes');
  const notes = await response.json();
  render(notes);
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

  const response = await fetch('/api/commands/create-note', {
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
