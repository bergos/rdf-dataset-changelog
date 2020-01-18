const rdf = { ...require('@rdfjs/dataset') }

class Changelog {
  constructor ({ factory = rdf, added, deleted } = {}) {
    this.factory = factory

    this.added = added || this.factory.dataset()
    this.deleted = deleted || this.factory.dataset()
  }

  applyTo (dataset) {
    for (const quad of this.added) {
      dataset.add(quad)
    }

    for (const quad of this.deleted) {
      dataset.delete(quad)
    }

    return this
  }
}

module.exports = Changelog
