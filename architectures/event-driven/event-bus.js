const EventEmitter = require('events');

class EventBus extends EventEmitter {
  publish(event) {
    this.emit(event.type, event);
  }

  subscribe(type, handler) {
    this.on(type, handler);
  }
}

module.exports = { EventBus };
