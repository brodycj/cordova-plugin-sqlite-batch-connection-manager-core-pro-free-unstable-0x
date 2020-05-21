// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

function openDatabaseConnection (options, cb, errorCallback) {
  cordova.exec(
    cb,
    errorCallback,
    'SQLiteBatchConnectionManager',
    'openDatabaseConnection',
    [options]
  )
}

function executeBatch (connectionId, batchList, cb) {
  const batchLength = batchList.length

  var results = []

  var isPartial = false

  var partialResult = null

  var partialRows = null

  function success (data) {
    if (isPartial) {
      partialRows.push(data)
      if (partialRows.length === partialResult.rowsLength) {
        results = results.concat({
          status: 0,
          columns: partialResult.columns,
          rows: partialRows
        })
        isPartial = false
      }
    } else if (data.partial) {
      isPartial = true
      partialResult = data
      partialRows = []
    } else {
      results = results.concat(data)
    }

    if (results.length === batchLength) {
      cb(results)
      results = []
    }
  }

  cordova.exec(success, null, 'SQLiteBatchConnectionManager', 'executeBatch', [
    connectionId,
    // avoid potential behavior such as crashing in case of invalid
    // batchList due to possible API abuse
    batchList.map(function (entry) {
      return [
        entry[0],
        entry[1].map(function (parameter) {
          return parameter
        })
      ]
    })
  ])
}

window.sqliteBatchConnectionManager = {
  openDatabaseConnection: openDatabaseConnection,
  executeBatch: executeBatch
}
