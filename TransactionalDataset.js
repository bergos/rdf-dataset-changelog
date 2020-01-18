const ChangelogDataset = require('./ChangelogDataset')
const DatasetCore = require('@rdfjs/dataset/DatasetCore')
const JsonChangelog = require('./lib/JsonChangelog')

class TransactionalDataset extends DatasetCore {
  constructor (quads, { change, complete, request, Changelog = JsonChangelog } = {}) {
    super(quads)

    this.change = change || (() => Promise.resolve())
    this.complete = complete || (() => Promise.resolve())
    this.request = request || (() => Promise.resolve())
    this.Changelog = Changelog
  }

  applyDiff (diff) {
    const changelog = new this.Changelog({ diff })

    changelog.applyTo(this)

    this.change(changelog)

    return changelog
  }

  async begin () {
    await this.request()

    const changelogDataset = new ChangelogDataset(this)

    changelogDataset.commit = async () => {
      const changelog = new this.Changelog(changelogDataset.flush())

      await this.complete(changelog.toDiff())

      changelog.applyTo(this)

      this.change(changelog)
    }

    return changelogDataset
  }
}

module.exports = TransactionalDataset
