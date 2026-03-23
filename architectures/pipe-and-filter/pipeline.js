class Pipeline {
  constructor(filters) {
    this.filters = filters;
  }

  run(input) {
    return this.filters.reduce((context, filter) => filter(context), { input });
  }
}

module.exports = { Pipeline };
