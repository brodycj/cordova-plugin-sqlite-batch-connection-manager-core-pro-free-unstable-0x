# cordova-plugin-sqlite-batch-connection-manager-core-pro-free

based on: <https://github.com/brodybits/cordova-plugin-sqlite-batch-connection-manager-core>

Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

**License:** GPL v3 with commercial license option available

**IMPORTANT UPGRADE NOTICE:** It is highly recommended to avoid breaking schema changes, database file name changes, and database directory path changes. Upgrades need to account for any old schema versions and database file paths that may still be in use. It is possible for users to upgrade at any time, even after many years.

**IMPORTANT CORRUPTION NOTICE:** SQLite database corruption is possible if accessed from multiple libraries, for example using both this library and built-in `android.sqlite.database` on Android ref:
- <https://ericsink.com/entries/multiple_sqlite_problem.html>
- <https://www.sqlite.org/faq.html#q5>
- <https://github.com/xpbrew/cordova-sqlite-storage/issues/626>

This can be caused by using multiple plugins to access the same database on Android.

Note that this plugin uses the `-DSQLITE_DEFAULT_SYNCHRONOUS=3` build setting to be extra-durable against crashes and power loss on all platforms ref:
- <https://github.com/xpbrew/cordova-sqlite-storage-help/issues/34>
- <https://github.com/xpbrew/cordova-sqlite-storage/issues/736>
- <http://sqlite.1065341.n5.nabble.com/Is-WAL-mode-more-robust-against-corruption-td99624.html>

This plugin uses the low-level sqlite-batch-connection-core C and Java components from here: <https://github.com/brodybits/sqlite-batch-connection-core-2020-01>

now with background processing included

## Build and Install

**Prerequisite:** Android NDK is required to build for Android

- clone this project from GitHub
- do `make build
- do `cordova plugin add` with local path to this plugin

## Sample usage

from `demo/www/app.js`:

```js
document.addEventListener('deviceready', onReady)

function log (text) {
  // log into the `messages` div:
  document.getElementById('messages').appendChild(document.createTextNode(text))
  document.getElementById('messages').appendChild(document.createElement('br'))
  // and to the console
  console.log(text)
}

const DATABASE_FILE_NAME = 'demo.db'

// SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE
// ref: https://www.sqlite.org/c3ref/open.html
const OPEN_DATABASE_FILE_FLAGS = 6

function openMemoryDatabaseConnection (openCallback, errorCallback) {
  window.sqliteBatchConnectionManager.openDatabaseConnection(
    { fullName: ':memory:', flags: 2 },
    openCallback,
    errorCallback
  )
}

function openFileDatabaseConnection (name, openCallback, errorCallback) {
  window.sqliteStorageFile.resolveAbsolutePath(
    {
      name: name,
      // TEMPORARY & DEPRECATED value, as needed for iOS & macOS ("osx"):
      location: 2
    },
    function (path) {
      log('database file path: ' + path)

      window.sqliteBatchConnectionManager.openDatabaseConnection(
        { fullName: path, flags: OPEN_DATABASE_FILE_FLAGS },
        openCallback,
        errorCallback
      )
    }
  )
}

function openCacheFileDatabaseConnection (name, openCallback, errorCallback) {
  window.resolveLocalFileSystemURL(
    // portable across Android, iOS, & macOS ("osx"):
    cordova.file.cacheDirectory,
    function (entry) {
      const dataDirectoryUrl = entry.toURL()

      log('data directory url: ' + dataDirectoryUrl)

      // hacky, working solution:
      const path = dataDirectoryUrl.substring(7) + name

      log('database cache file path: ' + path)

      window.sqliteBatchConnectionManager.openDatabaseConnection(
        { fullName: path, flags: OPEN_DATABASE_FILE_FLAGS },
        openCallback,
        errorCallback
      )
    }
  )
}

function onReady () {
  log('deviceready event received')
  startMemoryDatabaseDemo()
}

function startMemoryDatabaseDemo () {
  openMemoryDatabaseConnection(
    function (id) {
      log('memory database connection id: ' + id)

      window.sqliteBatchConnectionManager.executeBatch(
        id,
        [['SELECT UPPER(?)', ['Text']]],
        function (results) {
          log(JSON.stringify(results))
          startFileDatabaseDemo()
        }
      )
    },
    function (error) {
      log('UNEXPECTED OPEN MEMORY DATABASE ERROR: ' + error)
    }
  )
}

function startFileDatabaseDemo () {
  openFileDatabaseConnection(
    DATABASE_FILE_NAME,
    openDatabaseFileCallback,
    function (e) {
      log('UNEXPECTED OPEN ERROR: ' + e)
    }
  )
}

function openDatabaseFileCallback (connectionId) {
  log('open connection id: ' + connectionId)

  // ERROR TEST - file name with incorrect flags:
  window.sqliteBatchConnectionManager.openDatabaseConnection(
    { fullName: 'dummy.db', flags: 0 },
    function (_ignored) {
      log('FAILURE - unexpected open success callback received')
    },
    function (e) {
      log('OK - received error callback as expected for incorrect open call')

      // CONTINUE with batch demo, with the correct connectionId:
      batchDemo(connectionId)
    }
  )
}

function batchDemo (connectionId) {
  log('starting batch demo for connection id: ' + connectionId)
  window.sqliteBatchConnectionManager.executeBatch(
    connectionId,
    [
      [
        'SELECT ?, -?, LOWER(?), UPPER(?)',
        [null, 1234567.890123, 'ABC', 'Text']
      ],
      ['SELECT -?', [1234567890123456]], // should fit into 52 bits (signed)
      ['SLCT 1', []],
      ['SELECT ?', ['OK', 'out of bounds parameter']],
      ['DROP TABLE IF EXISTS Testing', []],
      ['CREATE TABLE Testing (data NOT NULL)', []],
      ["INSERT INTO Testing VALUES ('test data')", []],
      ['INSERT INTO Testing VALUES (null)', []],
      ['DELETE FROM Testing', []],
      ["INSERT INTO Testing VALUES ('test data 2')", []],
      ["INSERT INTO Testing VALUES ('test data 3')", []],
      ['SELECT * FROM Testing', []],
      ["SELECT 'xyz'", []]
    ],
    batchCallback
  )
}

function batchCallback (batchResults) {
  // show batch results in JSON string format (on all platforms)
  log('received batch results')
  log(JSON.stringify(batchResults))

  startReaderDemo()
}

function startReaderDemo () {
  openFileDatabaseConnection(
    DATABASE_FILE_NAME,
    function (id) {
      log('read from another connection id: ' + id)

      window.sqliteBatchConnectionManager.executeBatch(
        id,
        [['SELECT * FROM Testing', []]],
        function (res) {
          log(JSON.stringify(res))
          startCacheFileDemo()
        }
      )
    },
    function (error) {
      log('UNEXPECTED OPEN ERROR: ' + error)
    }
  )
}

function startCacheFileDemo () {
  openCacheFileDatabaseConnection(
    DATABASE_FILE_NAME,
    function (id) {
      log('cache file database connection id: ' + id)

      window.sqliteBatchConnectionManager.executeBatch(
        id,
        [
          ['DROP TABLE IF EXISTS Testing', []],
          ['CREATE TABLE Testing (data NOT NULL)', []],
          ["INSERT INTO Testing VALUES ('test data')", []],
          ['SELECT * FROM Testing', []]
        ],
        function (results) {
          log(JSON.stringify(results))
        }
      )
    },
    function (error) {
      log('UNEXPECTED OPEN ERROR: ' + error)
    }
  )
}
```
