(() => {
  const form = document.getElementById('notes-form');
  const notesList = document.getElementById('notes-list');
  const notes = [];

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

      const time = document.createElement('span');
      time.className = 'note-card__date';
      time.textContent = note.createdAt.toLocaleString();

      const content = document.createElement('p');
      content.textContent = note.content;

      const actions = document.createElement('div');
      actions.className = 'note-card__actions';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        // If no password was set, delete immediately
        if (!note.password || note.password.length === 0) {
          const index = notes.findIndex(entry => entry.id === note.id);
          if (index !== -1) {
            notes.splice(index, 1);
            renderNotes();
            alert('Note deleted.');
          }
          return;
        }

        
        const attempt = prompt('Enter the password to delete this note:');
        if (attempt === null) return;

        if (attempt === note.password) {
          const index = notes.findIndex(entry => entry.id === note.id);
          if (index !== -1) {
            notes.splice(index, 1);
            renderNotes();
            alert('Note deleted.');
          }
        } else {
          alert('Incorrect password.');
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

  form?.addEventListener('submit', event => {
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

    notes.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name,          
      content,
      password,      
      createdAt: new Date()
    });

    form.reset();
    renderNotes();
  });

  renderNotes();
})();
