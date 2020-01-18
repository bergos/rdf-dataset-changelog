function isDataset (dataset) {
  if (typeof dataset.size !== 'number') {
    return false
  }

  if (typeof dataset.add !== 'function') {
    return false
  }

  if (typeof dataset.delete !== 'function') {
    return false
  }

  if (typeof dataset.has !== 'function') {
    return false
  }

  if (typeof dataset.match !== 'function') {
    return false
  }

  return true
}

module.exports = isDataset
