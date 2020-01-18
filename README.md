# rdf-dataset-changelog

This package provides [RDFJS DatasetCore](https://rdf.js.org/dataset-spec/#datasetcore-interface) compatible datasets to track changes and handle transactions.

## Usage

### ChangelogDataset(quads)

`ChangelogDataset` tracks all changes in the `changes` property until `flush` is called.
Add the following line to your code to import the package: 

```javascript
const ChangelogDataset = require('rdf-dataset-changelog/ChangelogDataset')
```

The dataset implements the `DatasetCore` interface and the following additional properties and methods:

- `changes`: An object with an `added` and `deleted` property.
  Both properties are `DatasetCore` objects.
  `added` collects all quads added to the dataset.
  `deleted` collects all quads deleted from the dataset.
  Any conflicts of previously added/deleted quads in the same changeset are solved. 
- `flush()`: Assigns a new object to `changes` with empty datasets. 
  Returns the last `changes` object. 

### TransactionalDataset(quads, { change, complete, request, Changelog })

`TransactionalDataset` handles changes in transactions.
Add the following line to your code to import the package:

```javascript
const TransactionalDataset = require('rdf-dataset-changelog/TransactionalDataset')
```

A transaction is started by calling the `begin` method.
`begin` is an async method that returns a new `ChangedlogDataset` filled with all quads from the original dataset.
All changes in the transaction must be done on the returned dataset.
The optional `request` callback argument can be used to delay the start of a transaction.
Delaying the start can be useful to control the number of parallel transactions.
The returned dataset has an additional `commit` method which will apply all changes to the original dataset. 
All changes done in the transaction are forwarded as diff to the optional `complete` callback argument.
The `complete` callback can be used to sync the changes to another `TransactionalDataset`. 
The diff is created by an instance of a `Changelog` class.
By default, a JSON diff is used.
An alternative class can be provided as a `Changelog` argument in the constructor.   
The `applyDiff` method can be used to apply changes provides as diff.
Any changes done by `begin` + `commit` or `applyDiff` will trigger a call of the optional `change` callback argument.
It will be called with a `Changelog` object argument which contains all changes.

The dataset accepts the following options as the second argument of the constructor:

- `change`: An optional callback function that will be called for all changes done by `begin` + `commit` or `applyDiff`.
  All changes are provided as a `Changelog` object argument. 
- `complete`: An optional callback function that will be called when a transaction is finished with `commit`.
  All changes are provided as the argument in a diff object.
  If the callback returns a promise, the `commit` method will wait for it to resolve.
- `request`: An optional callback function that will be called each time a transaction is started with `begin`.
  If the callback returns a promise, the `begin` method will wait for it to resolve.
- `Changelog`: The constructor of the changelog class which should be used.
  By default, the `JsonChangelog` class is used.

The dataset implements the `DatasetCore` interface and the following additional methods:

- `applyDiff(diff)`: Applies all change from the given diff to the dataset.
  The `Changelog` class provided to the constructor will be used to parse the diff.
- `async begin()`: Starts a new transaction and returns the `ChangelogDataset` that tracks all changes.
  Calling `commit` on the returned dataset will apply all changes.

## Example

The following example creates a master and slave `TransactionalDataset` instance.
A mutex is used to allow only one transaction at a time.
The slave instanced get's synced in the `complete` callback via a diff.
The examples folder contains this example with more logging for easier understanding.

```javascript
const rdf = require('@rdfjs/data-model')
const namespace = require('@rdfjs/namespace')
const TransactionalDataset = require('rdf-dataset-changelog/TransactionalDataset')
const mutex = require('promise-the-world/mutex')

const ns = namespace('http://example.org/')

async function makeChanges ({ id, master }) {
  const change = await master.begin()
  change.add(rdf.quad(ns.subject, ns.predicate, rdf.literal(id)))
  await change.commit()
}

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

```
