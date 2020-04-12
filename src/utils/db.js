const DB_NAME = 'netflix-viewing-stats';
const DB_VERSION = 1;
const DB_STORE_NAME = 'viewingActivity';

/**
 * Return saved viewing activity in the last visit
 * @param {*} profileId
 */
function getSavedViewingActivity(profileId) {
  const dbName = `${DB_NAME}_${profileId}`;
  return new Promise((resolve, reject) => {
    debug('Opening DB...');
    let request = indexedDB.open(dbName, DB_VERSION);

    request.onsuccess = function(event) {
      let db = event.target.result;
      console.log('Successfully opened DB', event);

      // Make a request to get the viewing activity from the object store
      let transaction = db
        .transaction(DB_STORE_NAME)
        .objectStore(DB_STORE_NAME)
        .getAll();

      transaction.onsuccess = function(event) {
        console.log('Successfully retrieved saved items from indexedDb', event.target.result);
        resolve(event.target.result);
      };

      transaction.onerror = function(event) {
        console.error('Transaction error loading saved items in from indexedDb', event);
        resolve([]); // Resolve with empty array to load the full activity
      };
    };

    request.onerror = function(event) {
      console.error('Request error opening DB', event);
      resolve([]); // Resolve with empty array to load the full activity
    };

    request.onupgradeneeded = function(event) {
      debug('Created or updated DB. Upgrade needed', event);
      let store = event.currentTarget.result.createObjectStore(DB_STORE_NAME, {
        keyPath: 'index',
        autoIncrement: true,
      });

      store.createIndex('movieID', 'movieID', { unique: false });
    };
  });
}

/**
 * Save retrieved viewing activity for the next visit
 * @param {*} profileId
 * @param {*} viewedItems
 */
function saveViewingActivity(profileId, viewedItems) {
  const dbName = `${DB_NAME}_${profileId}`;
  debug('Opening DB...');
  let request = indexedDB.open(dbName, DB_VERSION);

  request.onsuccess = function(event) {
    let db = event.target.result;
    debug('Successfully opened DB', event);
    clearDataAndSave(db, viewedItems);
  };

  request.onerror = function(event) {
    console.error('Error opening DB. Error code', event.target.errorCode);
  };

  request.onupgradeneeded = function(event) {
    debug('Created or updated DB. Upgrade needed', event);
    let store = event.currentTarget.result.createObjectStore(DB_STORE_NAME, {
      keyPath: 'index',
      autoIncrement: true,
    });

    store.createIndex('movieID', 'movieID', { unique: false });
  };
}

/**
 * Clear viewing activity from indexedDb and save the new viewing activity
 * @param {*} profileId
 * @param {*} viewedItems
 */
function clearDataAndSave(db, viewedItems) {
  let transaction = db.transaction([DB_STORE_NAME], 'readwrite');

  transaction.oncomplete = function(event) {
    debug('Completed transaction clearData!', event);
    // Save viewing activity
    saveViewedItems(db, viewedItems);
  };

  transaction.onerror = function(event) {
    console.error('Transaction error clearing viewing activity from indexedDb', event);
  };

  // Make a request to clear all the data out of the object store
  let objectStore = transaction.objectStore(DB_STORE_NAME);
  let request = objectStore.clear();

  request.onsuccess = function(event) {
    debug('Successfully cleared viewing acticity from indexedDb', event);
  };

  request.onerror = function(event) {
    console.error('Request error clearing viewing activity from indexedDb', event);
  };
}

/**
 * Save viewed items in an asynchronous fashion
 * @param {*} profileId
 * @param {*} viewedItems
 */
function saveViewedItems(db, viewedItems) {
  let transaction = db.transaction([DB_STORE_NAME], 'readwrite');

  transaction.oncomplete = function(event) {
    debug('Completed transaction saveViewedItems!', event);
  };

  transaction.onerror = function(event) {
    console.error('Transaction error saving viewing activity in indexedDb', event);
  };

  // Make a request to insert every viewed item into the object store
  let objectStore = transaction.objectStore(DB_STORE_NAME);
  viewedItems.forEach(function(viewedItem) {
    let request = objectStore.put(viewedItem);

    request.onsuccess = function(event) {
      //debug('Successfully saved viewed item in indexedDb', viewedItem, event);
    };

    request.onerror = function(event) {
      console.error('Request error saving viewed item in indexedDb', viewedItem, event);
    };
  });
}
