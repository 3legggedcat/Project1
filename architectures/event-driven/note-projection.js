class NoteProjection {
  constructor(eventBus) {
    this.notes = new Map();

    eventBus.subscribe('NoteCreated', event => {
      this.notes.set(event.data.id, {
        id: event.data.id,
        name: event.data.name,
        content: event.data.content,
        password: event.data.password,
        createdAt: event.occurredAt,
      });
    });

    eventBus.subscribe('NoteDeleted', event => {
      this.notes.delete(event.data.id);
    });
  }

  getAll() {
    return Array.from(this.notes.values())
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(note => ({
        id: note.id,
        name: note.name,
        content: note.content,
        createdAt: note.createdAt,
        requiresPassword: Boolean(note.password),
      }));
  }

  getById(id) {
    return this.notes.get(id);
  }
}

module.exports = { NoteProjection };
