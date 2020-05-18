// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

package io.sqlc;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;

public class SQLiteBatchConnectionManager extends CordovaPlugin {
  @Override
  public boolean execute(String action, JSONArray args, CallbackContext cbc) {
    switch (action) {
      case "openDatabaseConnection":
        cbc.success(args);
      return true;
    }
    return false;
  }
}
