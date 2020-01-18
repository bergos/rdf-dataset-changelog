const { strictEqual } = require('assert')
const { describe, it } = require('mocha')
const namespace = require('@rdfjs/namespace')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const Changelog = require('../lib/Changelog')
const isDataset = require('./support/isDataset')

const ns = {
  ex: namespace('http://example.org/')
}

describe('Changelog', () => {
  it('should be a constructor', () => {
    strictEqual(typeof Changelog, 'function')
  })

  describe('constructor', () => {
    it('should have a added Dataset property', () => {
      const changelog = new Changelog()

      strictEqual(typeof changelog.added, 'object')
      strictEqual(isDataset(changelog.added), true)
    })

    it('should use the given added Dataset', () => {
      const added = rdf.dataset()
      const changelog = new Changelog({ added })

      strictEqual(changelog.added, added)
    })

    it('should have a deleted Dataset property', () => {
      const changelog = new Changelog()

      strictEqual(typeof changelog.deleted, 'object')
      strictEqual(isDataset(changelog.deleted), true)
    })

    it('should use the given deleted Dataset', () => {
      const deleted = rdf.dataset()
      const changelog = new Changelog({ deleted })

      strictEqual(changelog.deleted, deleted)
    })

    it('should use the given factory to create the added and deleted Dataset', () => {
      const factory = { dataset: () => 'test' }
      const changelog = new Changelog({ factory })

      strictEqual(changelog.added, 'test')
      strictEqual(changelog.deleted, 'test')
    })
  })

  describe('.applyTo', () => {
    it('should be a method', () => {
      const changelog = new Changelog()

      strictEqual(typeof changelog.applyTo, 'function')
    })

    it('should do nothing if the changelog is empty', () => {
      const dataset = rdf.dataset()
      const changelog = new Changelog()

      changelog.applyTo(dataset)

      strictEqual(dataset.size, 0)
    })

    it('should add all quads from the added dataset to the given dataset', () => {
      const quad1 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object1)
      const quad2 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object2)
      const dataset = rdf.dataset()
      const changelog = new Changelog()
      changelog.added.add(quad1)
      changelog.added.add(quad2)

      changelog.applyTo(dataset)

      strictEqual(dataset.size, 2)
      strictEqual(dataset.has(quad1), true)
      strictEqual(dataset.has(quad2), true)
    })

    it('should delete all quads from the deleted dataset from the given dataset', () => {
      const quad1 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object1)
      const quad2 = rdf.quad(ns.ex.subject, ns.ex.predicate, ns.ex.object2)
      const dataset = rdf.dataset([quad1, quad2])
      const changelog = new Changelog()
      changelog.deleted.add(quad1)
      changelog.deleted.add(quad2)

      changelog.applyTo(dataset)

      strictEqual(dataset.size, 0)
    })

    it('should return itself', () => {
      const dataset = rdf.dataset()
      const changelog = new Changelog()

      const result = changelog.applyTo(dataset)

      strictEqual(result, changelog)
    })
  })
})
