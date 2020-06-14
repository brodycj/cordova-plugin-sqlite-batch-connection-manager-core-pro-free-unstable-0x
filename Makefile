SQLITE_AMALGAMATION := sqlite-amalgamation-3320200
SQLITE_ZIP := $(SQLITE_AMALGAMATION).zip

SQLITE_BATCH_CONNECTION_CORE_REMOTE := \
	https://github.com/brodybits/sqlite-batch-connection-core-2020-01

SQLITE_BATCH_CONNECTION_CORE_ROOT := sqlite-batch-connection-core

SQLITE_BATCH_CONNECTION_CORE_COMMIT_ID := \
	603b806014689e15e071a1ded0ae551ca442db7d

all:
	echo 'all not supported' && exit 1

build: clean fetch-dependencies update-dependencies build-dist-dependencies

prepare-demo: build prepare-demo-plugins

fetch-dependencies:
	curl -O https://sqlite.org/2020/$(SQLITE_ZIP)
	unzip $(SQLITE_ZIP)
	git clone $(SQLITE_BATCH_CONNECTION_CORE_REMOTE) $(SQLITE_BATCH_CONNECTION_CORE_ROOT)

update-dependencies:
	(cd $(SQLITE_BATCH_CONNECTION_CORE_ROOT) && git checkout $(SQLITE_BATCH_CONNECTION_CORE_COMMIT_ID))

build-dist-dependencies:
	(cd $(SQLITE_BATCH_CONNECTION_CORE_ROOT)/sccglue && make jar)
	mkdir dist-dependencies
	cp $(SQLITE_BATCH_CONNECTION_CORE_ROOT)/sccglue/*.jar dist-dependencies
	cp $(SQLITE_BATCH_CONNECTION_CORE_ROOT)/android/src/main/java/io/sqlc/SQLiteBatchCore.java dist-dependencies
	cp $(SQLITE_BATCH_CONNECTION_CORE_ROOT)/sqlite-connection-core.[hc] dist-dependencies
	cp $(SQLITE_BATCH_CONNECTION_CORE_ROOT)/ios/SQLiteBatchCore.[hm] dist-dependencies
	cp $(SQLITE_AMALGAMATION)/sqlite3.* dist-dependencies

prepare-demo-plugins:
	mkdir -p demo/local-plugin
	cp -r dist-dependencies package.json plugin.xml src www demo/local-plugin
	(cd demo && cordova plugin add ./local-plugin cordova-plugin-file cordova-sqlite-storage-file && cordova plugin ls)
	echo 'use Cordova to add desired platform to the demo before running'

clean: clean-demo
	rm -rf sqlite-amalgamation-* sqlite-batch-connection-* dist-dependencies

clean-demo:
	rm -rf demo/node_modules demo/package-lock.json demo/local-plugin demo/plugins demo/platforms
