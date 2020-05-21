// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

package io.sqlc;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

public class SQLiteBatchConnectionManager extends CordovaPlugin {
  static class JSONBatchData implements SQLiteBatchCore.BatchData {
    JSONBatchData (JSONArray data) {
      this.data = data;
    }

    @Override
    public int getEntryCount() {
      try {
        return data.length();
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public void openEntry(int index) {
      try {
        entry = data.getJSONArray(index);
        bind = entry.getJSONArray(1);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public String getEntryStatement() {
      try {
        return entry.getString(0);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public int getEntryBindColumnCount() {
      try {
        return bind.length();
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public boolean isEntryBindColumnNumber(int column) {
      try {
        // TBD CACHE THIS VALUE:
        final Object o = bind.get(column);

        return (o instanceof Number);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public boolean isEntryBindColumnString(int column) {
      try {
        // TBD CACHE THIS VALUE:
        final Object o = bind.get(column);

        return (o instanceof String);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public double getEntryBindColumnDouble(int column) {
      try {
        return bind.optDouble(column);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public String getEntryBindColumnString(int column) {
      try {
        return bind.optString(column);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    JSONArray data;
    JSONArray entry;
    JSONArray bind;
  }

  static class JSONBatchResults implements SQLiteBatchCore.BatchResults {
    JSONBatchResults(JSONArray results) {
      this.results = results;
    }

    @Override
    public void startNewEntry() {
      result = new JSONObject();
    }

    @Override
    public void entryPutFieldAsInteger(String name, int value) {
      try {
        result.put(name, value);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public void entryPutFieldAsString(String name, String value) {
      try {
        result.put(name, value);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public void putNewEntry() {
      results.put(result);
    }

    @Override
    public void startNewEntryWithRows() {
      result = new JSONObject();
      columns = new JSONArray();
      rows = new JSONArray();
    }

    @Override
    public void entryPutColumnName(String columnName) {
      columns.put(columnName);
    }

    @Override
    public void startEntryRow() {
      row = new JSONArray();
    }

    @Override
    public void entryPutRowValueAsString(String value) {
      row.put(value);
    }

    @Override
    public void entryPutRowValueAsDouble(double value) {
      try {
        row.put(value);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    @Override
    public void entryPutRowValueAsNull() {
      row.put(JSONObject.NULL);
    }

    @Override
    public void entryPutRow() {
      rows.put(row);
    }

    @Override
    public void putNewEntryWithRows() {
      try {
        result.put("status", 0); // SQLite OK
        result.put("columns", columns);
        result.put("rows", rows);
        results.put(result);
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    JSONArray results;
    JSONObject result;

    JSONArray columns;
    JSONArray rows;
    JSONArray row;
  }

  @Override
  public boolean execute(String method, JSONArray data, CallbackContext cbc) {
    switch(method) {
      case "openDatabaseConnection":
        openDatabaseConnection(data, cbc);
        break;
      case "executeBatch":
        executeBatch(data, cbc);
        break;
      default:
        return false;
    }
    return true;
  }

  static private void
  openDatabaseConnection(JSONArray args, CallbackContext cbc) {
    try {
      final JSONObject options = args.getJSONObject(0);

      final String fullName = options.getString("fullName");

      final int flags = options.getInt("flags");

      final int mydbc = SQLiteBatchCore.openBatchConnection(fullName, flags);

      if (mydbc < 0) {
        cbc.error("open error: " + -mydbc);
      } else {
        cbc.success(mydbc);
      }
    } catch(Exception e) {
      // NOT EXPECTED - internal error:
      cbc.error(e.toString());
    }
  }

  static private void executeBatch(JSONArray args, CallbackContext cbc) {
    try {
      final int mydbc = args.getInt(0);

      JSONArray data = args.getJSONArray(1);

      // Background threading is under future consideration at this point
      // (expected to be straightforward for both Android & iOS)
      executeBatchNow(mydbc, data, cbc);
    } catch(Exception e) {
      // NOT EXPECTED - internal error:
      cbc.error(e.toString());
    }
  }

  static private void
  executeBatchNow(final int mydbc, JSONArray data, CallbackContext cbc) {
    try {
      JSONArray results = new JSONArray();

      SQLiteBatchCore.executeBatch(mydbc,
        new JSONBatchData(data),
        new JSONBatchResults(results));

      cbc.success(results);
    } catch(Exception e) {
      // NOT EXPECTED - internal error:
      cbc.error(e.toString());
    }
  }
}
