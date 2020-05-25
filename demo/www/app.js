// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

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

// with 100 characters:
const BIG_DATA_PATTERN_PART =
  'abcdefghijklmnopqrstuvwxyz----' +
  '1234567890123456789-' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ----' +
  '1234567890123456789-'

const BIG_DATA_PATTERN_FACTOR = 200

// Seems to be OK without the pro-free enhancements:
// const BIG_DATA_PATTERN_INSERT_COUNT = 1000
// OK with the pro-free enhancements,
// triggers OOM issue without the pro-free enhancements:
const BIG_DATA_PATTERN_INSERT_COUNT = 2000

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
          startBigDataMemoryTest()
        }
      )
    },
    function (error) {
      log('UNEXPECTED OPEN ERROR: ' + error)
    }
  )
}

function startBigDataMemoryTest () {
  log('START BIG DATA test')

  openMemoryDatabaseConnection(
    function (connectionId) {
      log('BIG DATA memory database test connection id: ' + connectionId)
      continueBigDataMemoryTest(connectionId)
    },
    function (error) {
      log('UNEXPECTED OPEN BIG DATA MEMORY DATABASE ERROR: ' + error)
    }
  )
}

function continueBigDataMemoryTest (connectionId) {
  // A workaround is needed here since String.prototype.repeat()
  // does not work on all supported Android versions
  // at the time of adding this test.
  // const BIG_DATA_PATTERN = BIG_DATA_PATTERN_PART.repeat(BIG_DATA_PATTERN_FACTOR)
  var bigPattern = ''
  for (var i = 0; i < BIG_DATA_PATTERN_FACTOR; ++i) {
    bigPattern = bigPattern.concat(BIG_DATA_PATTERN_PART)
  }
  const BIG_DATA_PATTERN = bigPattern

  var rowCount = 0

  log('INSERT BIG DATA')

  window.sqliteBatchConnectionManager.executeBatch(
    connectionId,
    [['CREATE TABLE BIG (DATA)', []]],
    addRow
  )

  function addRow () {
    ++rowCount
    window.sqliteBatchConnectionManager.executeBatch(
      connectionId,
      [
        ['INSERT INTO BIG VALUES (?)', [BIG_DATA_PATTERN + (100000 + rowCount)]]
      ],
      function () {
        if (rowCount < BIG_DATA_PATTERN_INSERT_COUNT) {
          addRow()
        } else {
          checkBigData()
        }
      }
    )
  }

  function checkBigData () {
    log('CHECK info stored in BIG data table')
    window.sqliteBatchConnectionManager.executeBatch(
      connectionId,
      [
        ['SELECT COUNT(*) FROM BIG', []],
        ['SELECT DATA FROM BIG', []]
      ],
      function (results) {
        log('SELECT BIG DATA OK')
        log('SELECT COUNT results: ' + JSON.stringify(results[0]))
        log('SELECT BIG DATA rows length: ' + results[1].rows.length)
        extraCheck1()
      }
    )
  }

  // extra checks are added to verify that SELECT BIG DATA is OK
  // regardless of other statements in the same batch
  // with the pro-free memory usage workaround on Android

  function extraCheck1 () {
    log('EXTRA CHECK 1')
    window.sqliteBatchConnectionManager.executeBatch(
      connectionId,
      [
        ['SELECT COUNT(*) FROM BIG', []],
        ['SELECT UPPER(?)', ['Extra test 1']],
        ['SELECT DATA FROM BIG', []],
        ['SELECT LOWER(?)', ['Extra test 2']]
      ],
      function (results) {
        log('SELECT COUNT results: ' + JSON.stringify(results[0]))
        log('EXTRA SELECT 1 result: ' + JSON.stringify(results[1]))
        log('SELECT BIG DATA rows length: ' + results[2].rows.length)
        log('EXTRA SELECT 2 result: ' + JSON.stringify(results[3]))
        extraCheck2()
      }
    )
  }

  function extraCheck2 () {
    log('EXTRA CHECK 2')
    window.sqliteBatchConnectionManager.executeBatch(
      connectionId,
      [
        ['SELECT COUNT(*) FROM BIG', []],
        ['SELECT UPPER(?)', ['Extra test 1']],
        ['SELECT DATA FROM BIG', []]
      ],
      function (results) {
        log('SELECT COUNT results: ' + JSON.stringify(results[0]))
        log('Extra test 1 result: ' + JSON.stringify(results[1]))
        log('SELECT BIG DATA rows length: ' + results[2].rows.length)
        extraCheck3()
      }
    )
  }

  function extraCheck3 () {
    log('EXTRA CHECK 3')
    window.sqliteBatchConnectionManager.executeBatch(
      connectionId,
      [['SELECT DATA FROM BIG', []]],
      function (results) {
        log('SELECT BIG DATA OK')
        log('SELECT BIG DATA rows length: ' + results[0].rows.length)
      }
    )
  }
}
