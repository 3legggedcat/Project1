const createId = () => Math.random().toString(36).slice(2, 10);

class NoteService {
  constructor({ eventBus, eventStore, noteProjection }) {
    this.eventBus = eventBus;
    this.eventStore = eventStore;
    this.noteProjection = noteProjection;
  }

  createNote({ name, content, password }) {
    const trimmedContent = (content || '').trim();
    if (!trimmedContent) {
      throw new Error('Note content is required.');
    }

    const event = {
      id: createId(),
      type: 'NoteCreated',
      occurredAt: new Date().toISOString(),
      data: {
        id: createId(),
        name: (name || '').trim() || 'Anonymous',
        content: trimmedContent,
        password: (password || '').trim(),
      },
    };

    this.eventStore.append(event);
    this.eventBus.publish(event);

    return this.noteProjection.getById(event.data.id);
  }

  deleteNote({ id, password }) {
    const note = this.noteProjection.getById(id);

    if (!note) {
      throw new Error('Note not found.');
    }

    if (note.password && note.password !== (password || '')) {
      const error = new Error('Incorrect password.');
      error.statusCode = 403;
      throw error;
    }

    const event = {
      id: createId(),
      type: 'NoteDeleted',
      occurredAt: new Date().toISOString(),
      data: { id },
    };

    this.eventStore.append(event);
    this.eventBus.publish(event);
  }
}

module.exports = { NoteService };
