const createId = () => Math.random().toString(36).slice(2, 10);

const sanitizeInput = context => {
  context.note = {
    name: (context.input.name || '').trim() || 'Anonymous',
    content: (context.input.content || '').trim(),
    password: (context.input.password || '').trim(),
  };

  return context;
};

const validateNote = context => {
  if (!context.note.content) {
    const error = new Error('Note content is required.');
    error.statusCode = 400;
    throw error;
  }

  return context;
};

const enrichNote = context => {
  context.note = {
    ...context.note,
    id: createId(),
    createdAt: new Date().toISOString(),
  };

  return context;
};

const persistNote = noteStore => context => {
  noteStore.unshift(context.note);
  return context;
};

const locateNote = noteStore => context => {
  const note = noteStore.find(entry => entry.id === context.input.id);

  if (!note) {
    const error = new Error('Note not found.');
    error.statusCode = 404;
    throw error;
  }

  context.note = note;
  return context;
};

const authorizeDelete = context => {
  if (context.note.password && context.note.password !== (context.input.password || '')) {
    const error = new Error('Incorrect password.');
    error.statusCode = 403;
    throw error;
  }

  return context;
};

const removeNote = noteStore => context => {
  const nextNotes = noteStore.filter(entry => entry.id !== context.note.id);
  noteStore.length = 0;
  noteStore.push(...nextNotes);
  return context;
};

module.exports = {
  sanitizeInput,
  validateNote,
  enrichNote,
  persistNote,
  locateNote,
  authorizeDelete,
  removeNote,
};
