const { deepStrictEqual, strictEqual } = require('assert')
const { describe, it } = require('mocha')
const namespace = require('@rdfjs/namespace')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const JsonChangelog = require('../lib/JsonChangelog')

const ns = {
  ex: namespace('http://example.org/')
}

describe('JsonChangelog', () => {
  it('should be a constructor', () => {
    strictEqual(typeof JsonChangelog, 'function')
  })

  describe('constructor', () => {
    it('should fill added from a diff', () => {
      const quad1 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object1, rdf.defaultGraph())
      const quad2 = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.blankNode(), ns.ex.graph)
      const diff = {
        added: [{
          subject: { termType: quad1.subject.termType, value: quad1.subject.value },
          predicate: { termType: quad1.predicate.termType, value: quad1.predicate.value },
          object: { termType: quad1.object.termType, value: quad1.object.value },
          graph: { termType: quad1.graph.termType, value: quad1.graph.value }
        }, {
          subject: { termType: quad2.subject.termType, value: quad2.subject.value },
          predicate: { termType: quad2.predicate.termType, value: quad2.predicate.value },
          object: { termType: quad2.object.termType, value: quad2.object.value },
          graph: { termType: quad2.graph.termType, value: quad2.graph.value }
        }],
        deleted: []
      }
      const changelog = new JsonChangelog({ diff })

      strictEqual(changelog.added.size, 2)
      strictEqual(changelog.added.has(quad1), true)
      strictEqual(changelog.added.has(quad2), true)
    })

    it('should fill deleted from a diff', () => {
      const quad1 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object1, rdf.defaultGraph())
      const quad2 = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.blankNode(), ns.ex.graph)
      const diff = {
        added: [],
        deleted: [{
          subject: { termType: quad1.subject.termType, value: quad1.subject.value },
          predicate: { termType: quad1.predicate.termType, value: quad1.predicate.value },
          object: { termType: quad1.object.termType, value: quad1.object.value },
          graph: { termType: quad1.graph.termType, value: quad1.graph.value }
        }, {
          subject: { termType: quad2.subject.termType, value: quad2.subject.value },
          predicate: { termType: quad2.predicate.termType, value: quad2.predicate.value },
          object: { termType: quad2.object.termType, value: quad2.object.value },
          graph: { termType: quad2.graph.termType, value: quad2.graph.value }
        }]
      }
      const changelog = new JsonChangelog({ diff })

      strictEqual(changelog.deleted.size, 2)
      strictEqual(changelog.deleted.has(quad1), true)
      strictEqual(changelog.deleted.has(quad2), true)
    })
  })

  describe('.toDiff', () => {
    it('should be a method', () => {
      const changelog = new JsonChangelog()

      strictEqual(typeof changelog.toDiff, 'function')
    })

    it('should build the diff for added', () => {
      const quad1 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object1, rdf.defaultGraph())
      const quad2 = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.blankNode(), ns.ex.graph)
      const expected = {
        added: [{
          subject: { termType: quad1.subject.termType, value: quad1.subject.value },
          predicate: { termType: quad1.predicate.termType, value: quad1.predicate.value },
          object: { termType: quad1.object.termType, value: quad1.object.value },
          graph: { termType: quad1.graph.termType, value: quad1.graph.value }
        }, {
          subject: { termType: quad2.subject.termType, value: quad2.subject.value },
          predicate: { termType: quad2.predicate.termType, value: quad2.predicate.value },
          object: { termType: quad2.object.termType, value: quad2.object.value },
          graph: { termType: quad2.graph.termType, value: quad2.graph.value }
        }],
        deleted: []
      }
      const changelog = new JsonChangelog()
      changelog.added.add(quad1)
      changelog.added.add(quad2)

      const diff = changelog.toDiff()

      deepStrictEqual(diff, expected)
    })

    it('should build the diff for deleted', () => {
      const quad1 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object1, rdf.defaultGraph())
      const quad2 = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.blankNode(), ns.ex.graph)
      const expected = {
        added: [],
        deleted: [{
          subject: { termType: quad1.subject.termType, value: quad1.subject.value },
          predicate: { termType: quad1.predicate.termType, value: quad1.predicate.value },
          object: { termType: quad1.object.termType, value: quad1.object.value },
          graph: { termType: quad1.graph.termType, value: quad1.graph.value }
        }, {
          subject: { termType: quad2.subject.termType, value: quad2.subject.value },
          predicate: { termType: quad2.predicate.termType, value: quad2.predicate.value },
          object: { termType: quad2.object.termType, value: quad2.object.value },
          graph: { termType: quad2.graph.termType, value: quad2.graph.value }
        }]
      }
      const changelog = new JsonChangelog()
      changelog.deleted.add(quad1)
      changelog.deleted.add(quad2)

      const diff = changelog.toDiff()

      deepStrictEqual(diff, expected)
    })
  })
})
