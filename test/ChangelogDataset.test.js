const { strictEqual } = require('assert')
const { describe, it } = require('mocha')
const datasetCoreTests = require('@rdfjs/dataset/test/DatasetCore')
const namespace = require('@rdfjs/namespace')
const rdf = require('@rdfjs/data-model')
const ChangelogDataset = require('../ChangelogDataset')

function dataset (quads) {
  return new ChangelogDataset(quads)
}

const factory = { dataset }

const ns = namespace('http://example.org/')

describe('ChangelogDataset', () => {
  datasetCoreTests({ ...factory, ...rdf })

  it('should be a constructor', () => {
    strictEqual(typeof ChangelogDataset, 'function')
  })

  describe('.add', () => {
    it('should add quads to the changes.added dataset', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset()

      dataset.add(quad1)
      dataset.add(quad2)

      strictEqual(dataset.changes.added.size, 2)
      strictEqual(dataset.changes.added.has(quad1), true)
      strictEqual(dataset.changes.added.has(quad2), true)
    })

    it('should remove existing quads from changes.deleted dataset', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset([quad1, quad2])
      dataset.delete(quad1)
      dataset.delete(quad2)

      dataset.add(quad1)
      dataset.add(quad2)

      strictEqual(dataset.changes.added.size, 0)
      strictEqual(dataset.changes.deleted.size, 0)
    })
  })

  describe('.delete', () => {
    it('should add quads to the changes.deleted dataset', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset([quad1, quad2])

      dataset.delete(quad1)
      dataset.delete(quad2)

      strictEqual(dataset.changes.deleted.size, 2)
      strictEqual(dataset.changes.deleted.has(quad1), true)
      strictEqual(dataset.changes.deleted.has(quad2), true)
    })

    it('should not add quads to the changes.deleted dataset if the dataset did not contain them', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset()

      dataset.delete(quad1)
      dataset.delete(quad2)

      strictEqual(dataset.changes.deleted.size, 0)
    })

    it('should only remove previously added quads from the changes.added dataset', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset()
      dataset.add(quad1)
      dataset.add(quad2)

      dataset.delete(quad1)
      dataset.delete(quad2)

      strictEqual(dataset.changes.added.size, 0)
      strictEqual(dataset.changes.deleted.size, 0)
    })
  })

  describe('.flush', () => {
    it('should be a method', () => {
      const dataset = new ChangelogDataset()

      strictEqual(typeof dataset.flush, 'function')
    })

    it('should clean the changes datasets', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset([quad2])
      dataset.add(quad1)
      dataset.delete(quad2)

      dataset.flush()

      strictEqual(dataset.changes.added.size, 0)
      strictEqual(dataset.changes.deleted.size, 0)
    })

    it('should return all changes till last flush', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const dataset = new ChangelogDataset([quad2])
      dataset.add(quad1)
      dataset.delete(quad2)

      const changes = dataset.flush()

      strictEqual(changes.added.size, 1)
      strictEqual(changes.added.has(quad1), true)
      strictEqual(changes.deleted.size, 1)
      strictEqual(changes.deleted.has(quad2), true)
    })
  })
})
