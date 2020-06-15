// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

package io.sqlc;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import java.util.Vector;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONObject;

public class SQLiteBatchConnectionManager extends CordovaPlugin {
  // starting with *conservative* cutoff size of 5MB
  static private final int JSON_RESULTS_ROUGH_CUTOFF_SIZE = 5*1000*1000;

  static class BatchData implements SQLiteBatchCore.BatchData {
    BatchData (JSONArray data) {
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

  static class BatchResults implements SQLiteBatchCore.BatchResults {
    BatchResults(int totalResultCount, CallbackContext cbc) {
      this.totalResultCount = totalResultCount;
      this.cbc = cbc;
      this.jsonResults = new Vector<String>(totalResultCount);
      this.jsonResultsRoughSize = 0;
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
      String jsonResult = this.result.toString();

      this.jsonResults.add(jsonResult);
      this.jsonResultsRoughSize += jsonResult.length();
      ++this.resultCount;
      if (this.resultCount == this.totalResultCount) this.sendResults();
    }

    @Override
    public void startNewEntryWithRows() {
      result = new JSONObject();
      columns = new JSONArray();
      this.jsonRows = new Vector<String>();
      this.jsonRowsRoughSize = 0;
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
      String jsonRow = this.row.toString();
      this.jsonRows.add(jsonRow);
      this.jsonRowsRoughSize += jsonRow.length();
    }

    @Override
    public void putNewEntryWithRows() {
      try {
        if ((this.jsonResultsRoughSize + this.jsonRowsRoughSize) < JSON_RESULTS_ROUGH_CUTOFF_SIZE) {
          // String.join() seems to be not working on
          // all supported Android versions
          String jsonResult =
            "{" +
            "\"status\"" + ":" + "0" + "," +
            "\"columns\"" + ":" + columns.toString() + ","+
            "\"rows\"" + ":" + this.jsonRows +
            "}";

          this.jsonResults.add(jsonResult);
          this.jsonResultsRoughSize += jsonResult.length();
          ++this.resultCount;
          if (this.resultCount == this.totalResultCount) this.sendResults();

          return;
        }

        // else ...

        this.sendResults();

        final int rowsLength = jsonRows.size();

        result.put("status", 0); // SQLite OK
        result.put("partial", 1);
        result.put("columns", columns);
        result.put("rowsLength", rowsLength);

        ++resultCount;
        PluginResult pr = new PluginResult(PluginResult.Status.OK, result);
        pr.setKeepCallback(true);
        cbc.sendPluginResult(pr);

        for (int i=0; i<rowsLength; ++i) {
          pr = new JSONPluginResult(jsonRows.get(i));
          if (resultCount != totalResultCount || i < rowsLength)
            pr.setKeepCallback(true);
          cbc.sendPluginResult(pr);
        }
      } catch(Exception e) {
        // NOT EXPECTED - internal error:
        throw new RuntimeException(e);
      }
    }

    private void sendResults() {
      int sendCount = this.jsonResults.size();

      StringBuilder jsonBuilder = new StringBuilder();
      jsonBuilder.append('[');
      for (int i=0; i < sendCount; ++i) {
        if (i != 0) jsonBuilder.append(',');
        jsonBuilder.append(this.jsonResults.get(i));
      }
      jsonBuilder.append(']');

      PluginResult pr = new JSONPluginResult(jsonBuilder.toString());
      if (this.resultCount != this.totalResultCount) pr.setKeepCallback(true);
      cbc.sendPluginResult(pr);

      this.jsonResults = new Vector<String>(totalResultCount);
      this.jsonResultsRoughSize = 0;
    }

    private class JSONPluginResult extends PluginResult {
      JSONPluginResult(String json) {
        super(PluginResult.Status.OK);
        this.jsonString = json;
      }

      @Override
      public int getMessageType() {
        return PluginResult.MESSAGE_TYPE_JSON;
      }

      @Override
      public String getMessage() {
        return jsonString;
      }

      private String jsonString;
    }

    int totalResultCount;

    CallbackContext cbc;

    int resultCount;

    Vector<String> jsonResults;

    int jsonResultsRoughSize;

    JSONObject result;

    JSONArray columns;

    Vector<String> jsonRows;

    int jsonRowsRoughSize;

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

      threadPool.execute(new Runnable() {
        public void run() {
          executeBatchNow(mydbc, data, cbc);
        }
      });
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
        new BatchData(data),
        new BatchResults(data.length(), cbc));
    } catch(Exception e) {
      // NOT EXPECTED - internal error:
      cbc.error(e.toString());
    }
  }

  static {
    threadPool = Executors.newCachedThreadPool();
  }

  // This is really an instance of ExecutorService,
  // but only execute from Executor is needed here.
  static private Executor threadPool;
}
