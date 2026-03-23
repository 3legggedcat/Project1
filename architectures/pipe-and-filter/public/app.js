const form = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');
const pipelineView = document.getElementById('pipeline-view');

const renderNotes = notes => {
  notesList.innerHTML = '';

  if (!notes.length) {
    const item = document.createElement('li');
    item.textContent = 'No notes yet.';
    notesList.appendChild(item);
    return;
  }

  notes.forEach(note => {
    const item = document.createElement('li');

    const title = document.createElement('strong');
    title.textContent = note.name;

    const time = document.createElement('div');
    time.textContent = new Date(note.createdAt).toLocaleString();

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

      const response = await fetch(`/api/notes/${note.id}`, {
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

    item.appendChild(title);
    item.appendChild(time);
    item.appendChild(content);
    item.appendChild(button);
    notesList.appendChild(item);
  });
};

const loadNotes = async () => {
  const response = await fetch('/api/notes');
  const notes = await response.json();
  renderNotes(notes);
};

const loadPipeline = async () => {
  const response = await fetch('/api/pipeline');
  const pipeline = await response.json();
  pipelineView.textContent = JSON.stringify(pipeline, null, 2);
};

form.addEventListener('submit', async event => {
  event.preventDefault();

  const payload = {
    name: form.name.value.trim(),
    content: form.content.value.trim(),
    password: form.password.value.trim(),
  };

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

loadPipeline();
loadNotes();
