(() => {
  const determineApiBase = () => {
    if (typeof window === 'undefined') return '';
    if (window.API_BASE_URL) return window.API_BASE_URL;
    if (window.location.protocol === 'file:' || !window.location.host) {
      return 'http://localhost:5500';
    }
    return `${window.location.protocol}//${window.location.host}`;
  };

  const apiBase = determineApiBase();
  const apiFetch = (path, options = {}) => {
    const finalOptions = { ...options };
    finalOptions.headers = { ...(options.headers || {}) };

    if (finalOptions.body && !finalOptions.headers['Content-Type']) {
      finalOptions.headers['Content-Type'] = 'application/json';
    }

    return fetch(`${apiBase}${path}`, finalOptions);
  };

  const form = document.getElementById('notes-form');
  const notesList = document.getElementById('notes-list');
  let notes = [];

  const renderNotes = () => {
    notesList.innerHTML = '';

    if (notes.length === 0) {
      const placeholder = document.createElement('li');
      placeholder.className = 'empty-state';
      placeholder.textContent = 'No notes yet. Save one on the left to see it here.';
      notesList.appendChild(placeholder);
      return;
    }

    notes.forEach(note => {
      const listItem = document.createElement('li');
      listItem.className = 'note-card';

      const article = document.createElement('article');

      const header = document.createElement('div');
      header.className = 'note-card__header';

      const title = document.createElement('h4');
      title.textContent = note.name && note.name.trim() ? note.name : 'Anonymous';
```input the date and time```
      const time = document.createElement('span');
      time.className = 'note-card__date';
      const timestamp = note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt);
      time.textContent = timestamp.toLocaleString();

      const content = document.createElement('p');
      content.textContent = note.content;

      const actions = document.createElement('div');
      actions.className = 'note-card__actions';
      ```fix the issues delete notes```
      const requiresPassword = Boolean(
        note.requiresPassword ?? (note.password && note.password.trim())
      );

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', async () => {
        let passwordAttempt = '';

        if (requiresPassword) {
          const attempt = prompt('Enter the password to delete this note:');
          if (attempt === null) return;
          passwordAttempt = attempt;
        }

        try {
          const response = await apiFetch(`/api/notes/${note.id}`, {
            method: 'DELETE',
            body: JSON.stringify({ password: passwordAttempt }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unable to delete note.' }));
            throw new Error(error.message || 'Unable to delete note.');
          }

          notes = notes.filter(entry => entry.id !== note.id);
          renderNotes();
          alert('Note deleted.');
        } catch (err) {
          alert(err.message);
        }
      });

      header.appendChild(title);
      header.appendChild(time);
      actions.appendChild(deleteButton);

      article.appendChild(header);
      article.appendChild(content);
      article.appendChild(actions);
      listItem.appendChild(article);

      notesList.appendChild(listItem);
    });
  };

  const loadNotes = async () => {
    try {
      const response = await apiFetch('/api/notes');
      if (!response.ok) {
        throw new Error('Unable to load notes.');
      }
      const data = await response.json();
      notes = data.map(note => ({
        ...note,
        createdAt: new Date(note.createdAt),
        requiresPassword: Boolean(
          note.requiresPassword ?? (note.password && note.password.trim())
        ),
      }));
      renderNotes();
    } catch (err) {
      alert(err.message);
    }
  };

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const nameField = document.getElementById('user-note');
    const contentField = document.getElementById('note-content');
    const passwordField = document.getElementById('note-password');

    const content = contentField?.value.trim();
    const password = (passwordField?.value ?? '').trim();
    const name = (nameField?.value ?? '').trim() || 'Anonymous';

    if (!content) {
      alert('Please add note content.');
      return;
    }

    try {
      const response = await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ name, content, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Cant save note.' }));
        throw new Error(error.message || 'Unable to save note.');
      }

      const savedNote = await response.json();
      notes.unshift({
        ...savedNote,
        createdAt: new Date(savedNote.createdAt),
        requiresPassword: Boolean(
          savedNote.requiresPassword ?? (savedNote.password && savedNote.password.trim())
        ),
      });
      form.reset();
      renderNotes();
    } catch (err) {
      alert(err.message);
    }
  });

  loadNotes();
})();
