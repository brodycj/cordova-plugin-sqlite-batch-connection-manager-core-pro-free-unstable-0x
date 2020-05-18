// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

function openDatabaseConnection (callback) {
  cordova.exec(
    function () {
      callback('pong')
    },
    null,
    'SQLiteBatchConnectionManager',
    'openDatabaseConnection',
    null
  )
}

window.sqliteBatchConnectionManager = {
  openDatabaseConnection: openDatabaseConnection
}
