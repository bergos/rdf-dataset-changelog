const rdf = require('@rdfjs/data-model')
const namespace = require('@rdfjs/namespace')
const TransactionalDataset = require('../TransactionalDataset')
const delay = require('promise-the-world/delay')
const mutex = require('promise-the-world/mutex')

const ns = namespace('http://example.org/')

const start = Date.now()

function log (text, id) {
  console.log(`${id}: ${text} (${Date.now() - start}ms)`)
}

/*
 * Adds a quad to the master using the .begin & .commit API
 *
 * - id used for logging and the example data
 * - master dataset that will be changed
 * - slave dataset only for logging the changes
 */
async function makeChanges ({ id, master, slave }) {
  log('start change', id)

  // waits for the dataset lock
  const change = await master.begin()

  log('transaction started', id)

  change.add(rdf.quad(ns.subject, ns.predicate, rdf.literal(id)))

  log(`quads in master before commit: ${master.size}`, id)
  log(`quads in slave before commit: ${slave.size}`, id)

  // delay
  await delay(100)

  //
  await change.commit()

  log('transaction finished', id)

  log(`quads in master after commit: ${master.size}`, id)
  log(`quads in slave after commit: ${slave.size}`, id)
}

/**
 * Creates a master dataset that blocks parallel changes using a mutex in the request callback.
 * Creates a slave dataset that get's synced via .applyDiff in the complete callback of the master.
 */
async function main () {
  const slave = new TransactionalDataset()

  const transaction = mutex()
  const master = new TransactionalDataset(null, {
    request: async () => {
      await transaction.lock()
    },
    complete: diff => {
      slave.applyDiff(diff)

      transaction.unlock()
    }
  })

  await Promise.all([
    makeChanges({ id: '1', master, slave }),
    makeChanges({ id: '2', master, slave })
  ])
}

main()
