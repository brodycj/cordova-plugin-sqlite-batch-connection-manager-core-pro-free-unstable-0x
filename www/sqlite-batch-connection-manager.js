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
  cordova.exec(cb, null, 'SQLiteBatchConnectionManager', 'executeBatch', [
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
