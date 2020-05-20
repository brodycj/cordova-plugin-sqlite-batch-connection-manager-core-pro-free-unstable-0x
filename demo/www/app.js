// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

document.addEventListener('deviceready', onReady)

function log (text) {
  // log into the `messages` div:
  document.getElementById('messages').appendChild(document.createTextNode(text))
  document.getElementById('messages').appendChild(document.createElement('br'))
  // and to the console
  console.log(text)
}

function onReady () {
  log('deviceready event received')

  window.sqliteBatchConnectionManager.openDatabaseConnection(
    { fullName: ':memory:', flags: 2 },
    openCallback
  )
}

function openCallback (connectionId) {
  log('open connection id: ' + connectionId)

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

  window.sqliteBatchConnectionManager.openDatabaseConnection(
    { fullName: ':memory:', flags: 2 },
    openCallback2
  )
}

function openCallback2 (connectionId) {
  // 100 characters:
  const BIG_DATA_PATTERN1 =
    'abcdefghijklmnopqrstuvwxyz----' +
    '1234567890123456789-' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ----' +
    '1234567890123456789-'

  const BIG_DATA_FACTOR = 200

  const BIG_DATA_PATTERN2 = BIG_DATA_PATTERN1.repeat(BIG_DATA_FACTOR)

  // Seems to be OK without the pro-free enhancements:
  // const MAX_ROW_COUNT = 1000
  // OK with pro-free enhancements,
  // triggers OOM issue without the pro enhancements
  const MAX_ROW_COUNT = 2000

  var rowCount = 0

  log('START BIG DATA test')

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
        [
          'INSERT INTO BIG VALUES (?)',
          [BIG_DATA_PATTERN2 + (100000 + rowCount)]
        ]
      ],
      function () {
        if (rowCount < MAX_ROW_COUNT) addRow()
        else checkBigData()
      }
    )
  }

  function checkBigData () {
    log('CHECK info stored in BIG data table')
    window.sqliteBatchConnectionManager.executeBatch(
      connectionId,
      [
        ['SELECT COUNT(*) FROM BIG', []],
        ['SELECT DATA FROM BIG', []],
      ],
      function (results) {
        log('SELECT BIG DATA OK')
        log('SELECT COUNT results: ' + JSON.stringify(results[0]))
        log('SELECT BIG DATA rows length: ' + results[0].rows.length)
        extraCheck1()
      }
    )
  }

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
