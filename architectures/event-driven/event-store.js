class EventStore {
  constructor() {
    this.events = [];
  }

  append(event) {
    this.events.push(event);
  }

  getAll() {
    return [...this.events];
  }
}

module.exports = { EventStore };
