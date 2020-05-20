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
}
