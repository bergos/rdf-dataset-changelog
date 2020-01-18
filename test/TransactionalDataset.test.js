const { deepStrictEqual, strictEqual } = require('assert')
const { describe, it } = require('mocha')
const defer = require('promise-the-world/defer')
const datasetCoreTests = require('@rdfjs/dataset/test/DatasetCore')
const namespace = require('@rdfjs/namespace')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const JsonChangelog = require('../lib/JsonChangelog')
const TransactionalDataset = require('../TransactionalDataset')
const isDataset = require('./support/isDataset')

function dataset (quads) {
  return new TransactionalDataset(quads)
}

const factory = { dataset }

const ns = namespace('http://example.org/')

describe('TransactionalDataset', () => {
  datasetCoreTests({ ...factory, ...rdf })

  it('should be a constructor', () => {
    strictEqual(typeof TransactionalDataset, 'function')
  })

  describe('constructor', () => {
    it('should assign the given request function', () => {
      const request = () => {}

      const dataset = new TransactionalDataset(null, { request })

      strictEqual(dataset.request, request)
    })

    it('should assign a default request function', () => {
      const dataset = new TransactionalDataset()

      strictEqual(typeof dataset.request, 'function')
    })

    it('should assign the given complete function', () => {
      const complete = () => {}

      const dataset = new TransactionalDataset(null, { complete })

      strictEqual(dataset.complete, complete)
    })

    it('should assign a default complete function', () => {
      const dataset = new TransactionalDataset()

      strictEqual(typeof dataset.complete, 'function')
    })

    it('should assign the given change function', () => {
      const change = () => {}

      const dataset = new TransactionalDataset(null, { change })

      strictEqual(dataset.change, change)
    })

    it('should assign a default change function', () => {
      const dataset = new TransactionalDataset()

      strictEqual(typeof dataset.change, 'function')
    })

    it('should assign the given Changelog class', () => {
      class Changelog {}

      const dataset = new TransactionalDataset(null, { Changelog })

      strictEqual(dataset.Changelog, Changelog)
    })

    it('should assign a default Changelog class', () => {
      const dataset = new TransactionalDataset()

      strictEqual(dataset.Changelog, JsonChangelog)
    })
  })

  describe('.applyDiff', () => {
    it('should be a method', () => {
      const dataset = new TransactionalDataset()

      strictEqual(typeof dataset.applyDiff, 'function')
    })

    it('should apply changes from the diff to the dataset', () => {
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const changelog = new JsonChangelog({ added: rdf.dataset([quad1]), deleted: rdf.dataset([quad2]) })
      const diff = changelog.toDiff()
      const dataset = new TransactionalDataset([quad2])

      dataset.applyDiff(diff)

      strictEqual(dataset.size, 1)
      strictEqual(dataset.has(quad1), true)
    })

    it('should call the change function with the changelog as argument', async () => {
      const def = defer()
      const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
      const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
      const changelog = new JsonChangelog({ added: rdf.dataset([quad1]), deleted: rdf.dataset([quad2]) })
      const diff = changelog.toDiff()
      const dataset = new TransactionalDataset([quad2], { change: def.resolve })

      dataset.applyDiff(diff)

      const changes = await def.promise

      strictEqual(changes.added.size, 1)
      strictEqual(changes.added.has(quad1), true)
      strictEqual(changes.deleted.size, 1)
      strictEqual(changes.deleted.has(quad2), true)
    })
  })

  describe('.begin', () => {
    it('should be a method', () => {
      const dataset = new TransactionalDataset()

      strictEqual(typeof dataset.begin, 'function')
    })

    it('should call the request function', async () => {
      const def = defer()
      const dataset = new TransactionalDataset(null, { request: def.resolve })

      await dataset.begin()

      // TODO: don't check via timeout
      await def.promise
    })

    it('should return a ChangelogDataset', async () => {
      const dataset = new TransactionalDataset()

      const result = await dataset.begin()

      strictEqual(isDataset(result), true)
      strictEqual(typeof result.flush, 'function')
    })

    it('should return a ChangelogDataset with an attached .commit method', async () => {
      const dataset = new TransactionalDataset()

      const result = await dataset.begin()

      strictEqual(typeof result.commit, 'function')
    })

    describe('.commit', () => {
      it('should apply the changes', async () => {
        const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
        const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
        const dataset = new TransactionalDataset([quad2])
        const change = await dataset.begin()
        change.add(quad1)
        change.delete(quad2)

        await change.commit()

        strictEqual(dataset.size, 1)
        strictEqual(dataset.has(quad1), true)
      })

      it('should call the complete function with the diff as argument', async () => {
        const def = defer()
        const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
        const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
        const changelog = new JsonChangelog({ added: rdf.dataset([quad1]), deleted: rdf.dataset([quad2]) })
        const expected = changelog.toDiff()
        const dataset = new TransactionalDataset([quad2], { complete: def.resolve })
        const change = await dataset.begin()
        change.add(quad1)
        change.delete(quad2)

        await change.commit()

        const diff = await def.promise

        deepStrictEqual(diff, expected)
      })

      it('should call the change function with the changelog as argument', async () => {
        const def = defer()
        const quad1 = rdf.quad(ns.subject, ns.predicate, rdf.literal('1'), ns.graph)
        const quad2 = rdf.quad(ns.subject, ns.predicate, rdf.literal('2'), ns.graph)
        /* const changelog = new JsonChangelog({ added: rdf.dataset([quad1]), deleted: rdf.dataset([quad2]) })
        const expected = changelog.toDiff() */
        const dataset = new TransactionalDataset([quad2], { change: def.resolve })
        const change = await dataset.begin()
        change.add(quad1)
        change.delete(quad2)

        await change.commit()

        const changes = await def.promise

        strictEqual(changes.added.size, 1)
        strictEqual(changes.added.has(quad1), true)
        strictEqual(changes.deleted.size, 1)
        strictEqual(changes.deleted.has(quad2), true)
      })
    })
  })
})
