const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const Changelog = require('./Changelog')

function termToJSON (term) {
  if (term.termType === 'Literal') {
    return {
      termType: 'Literal',
      value: term.value,
      language: term.language,
      datatype: term.datatype.value
    }
  }

  return {
    termType: term.termType,
    value: term.value
  }
}

function quadToJSON (quad) {
  return {
    subject: termToJSON(quad.subject),
    predicate: termToJSON(quad.predicate),
    object: termToJSON(quad.object),
    graph: termToJSON(quad.graph)
  }
}

function quadsToJSON (quads) {
  return [...quads].map(quad => quadToJSON(quad))
}

function termFromJSON (json) {
  if (json.termType === 'BlankNode') {
    return rdf.blankNode(json.value)
  }

  if (json.termType === 'DefaultGraph') {
    return rdf.defaultGraph()
  }

  if (json.termType === 'Literal') {
    return rdf.literal(json.value, json.language || rdf.namedNode(json.datatype))
  }

  if (json.termType === 'NamedNode') {
    return rdf.namedNode(json.value)
  }
}

function quadFromJSON (json) {
  return rdf.quad(
    termFromJSON(json.subject),
    termFromJSON(json.predicate),
    termFromJSON(json.object),
    termFromJSON(json.graph))
}

function quadsFromJSON (json) {
  return rdf.dataset(json.map(item => quadFromJSON(item)))
}

class JsonChangelog extends Changelog {
  constructor ({ factory = rdf, added, deleted, diff } = {}) {
    super({ factory, added, deleted })

    if (diff) {
      this.added = quadsFromJSON(diff.added)
      this.deleted = quadsFromJSON(diff.deleted)
    }
  }

  toDiff () {
    return {
      added: quadsToJSON(this.added),
      deleted: quadsToJSON(this.deleted)
    }
  }
}

module.exports = JsonChangelog
