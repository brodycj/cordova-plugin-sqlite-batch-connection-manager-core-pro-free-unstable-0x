# cordova-plugin-sqlite-batch-connection-manager-core-pro-free

based on: <https://github.com/brodybits/cordova-plugin-sqlite-batch-connection-manager-core>

Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

**License:** GPL v3 with commercial license option available

**IMPORTANT UPGRADE NOTICE:** It is highly recommended to avoid breaking schema changes, database file name changes, and database directory path changes. Upgrades need to account for any old schema versions and database file paths that may still be in use. It is possible for users to upgrade at any time, even after many years.

**IMPORTANT CORRUPTION NOTICE 1:** SQLite database corruption is possible if accessed from multiple libraries, for example using both this library and built-in `android.sqlite.database` on Android ref:
- <https://ericsink.com/entries/multiple_sqlite_problem.html>
- <https://www.sqlite.org/faq.html#q5>
- <https://github.com/xpbrew/cordova-sqlite-storage/issues/626>

**IMPORTANT CORRUPTION NOTICE 2:** It is **highly** recommended to use `-DSQLITE_DEFAULT_SYNCHRONOUS=3` build setting to be extra-durable against crashes and power loss ref:
- <https://github.com/xpbrew/cordova-sqlite-storage-help/issues/34>
- <https://github.com/xpbrew/cordova-sqlite-storage/issues/736>
- <http://sqlite.1065341.n5.nabble.com/Is-WAL-mode-more-robust-against-corruption-td99624.html>

uses low-level sqlite-batch-connection-core C & Java component from here: <https://github.com/brodybits/sqlite-batch-connection-core-2020-01>
