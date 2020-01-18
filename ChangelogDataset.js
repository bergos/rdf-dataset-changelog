const DatasetCore = require('@rdfjs/dataset/DatasetCore')

class ChangelogDataset extends DatasetCore {
  constructor (quads) {
    super(quads)

    this.changes = null

    this.flush()
  }

  flush () {
    const lastChanges = this.changes

    this.changes = {
      added: new DatasetCore(),
      deleted: new DatasetCore()
    }

    return lastChanges
  }

  add (quad) {
    if (this.changes.deleted.has(quad)) {
      this.changes.deleted.delete(quad)
    } else {
      this.changes.added.add(quad)
    }

    super.add(quad)

    return this
  }

  delete (quad) {
    if (!this.has(quad)) {
      return this
    }

    if (this.changes.added.has(quad)) {
      this.changes.added.delete(quad)
    } else {
      this.changes.deleted.add(quad)
    }

    super.delete(quad)

    return this
  }
}

module.exports = ChangelogDataset
