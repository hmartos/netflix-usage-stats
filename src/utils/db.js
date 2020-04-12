const DB_NAME = 'netflix-viewing-stats';
const DB_VERSION = 1;
const DB_STORE_NAME = 'viewingActivity';
let db;

/**
 * Save retrieved viewing activity for the next visit
 * @param {*} viewedItems
 */
function saveViewingActivity(viewedItems) {
  debug('Opening DB...');
  let request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Successfully opened DB', event);
    saveViewedItems(viewedItems);
  };

  request.onerror = function(event) {
    console.error('Error opening DB. Error code', event.target.errorCode);
  };

  request.onupgradeneeded = function(event) {
    // TODO What to do here?
    debug('Created or updated DB. Upgrade needed', event);
    let store = event.currentTarget.result.createObjectStore(DB_STORE_NAME, {
      keyPath: 'index',
      autoIncrement: true,
    });

    store.createIndex('movieID', 'movieID', { unique: false });
  };
}

/**
 * Return saved viewing activity in the last visit
 */
function getSavedViewingActivity() {
  return new Promise((resolve, reject) => {
    debug('Opening DB...');
    let request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function(event) {
      db = event.target.result;
      console.log('Successfully opened DB', event);
      var transaction = db
        .transaction(DB_STORE_NAME)
        .objectStore(DB_STORE_NAME)
        .getAll();

      transaction.onsuccess = function(event) {
        console.log('Successfully retrieved saved items from indexedDb', event.target.result);
        resolve(event.target.result);
      };

      transaction.onerror = function(event) {
        console.error('Error loading saved items in from indexedDb. Error code', event.target.errorCode);
        resolve([]); // Resolve with empty array to load the full activity
      };
    };

    request.onerror = function(event) {
      console.error('Error opening DB. Error code', event.target.errorCode);
      resolve([]); // Resolve with empty array to load the full activity
    };

    request.onupgradeneeded = function(event) {
      // TODO What to do here?
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
 * Save viewed items in an asynchronous fashion
 * @param {*} viewedItems
 */
function saveViewedItems(viewedItems) {
  let transaction = db.transaction([DB_STORE_NAME], 'readwrite');
  // Do something when all the data is added to the database.
  transaction.oncomplete = function(event) {
    console.log('All done!', event);
  };

  transaction.onerror = function(event) {
    // Don't forget to handle errors!
    console.error('Error saving viewing activity in indexedDb', event);
  };

  let objectStore = transaction.objectStore(DB_STORE_NAME);
  viewedItems.forEach(function(viewedItem) {
    let request = objectStore.put(viewedItem);
    request.onsuccess = function(event) {
      console.log('Successfully saved viewed item in indexedDb', viewedItem, event);
    };
  });
}

// function addPublication(biblioid, title, year, blob) {
//   console.log('addPublication arguments:', arguments);
//   let obj = { biblioid: biblioid, title: title, year: year };
//   if (typeof blob != 'undefined') obj.blob = blob;

//   let store = getObjectStore(DB_STORE_NAME, 'readwrite');
//   let request;
//   try {
//     request = store.add(obj);
//   } catch (e) {
//     if (e.name == 'DataCloneError')
//       displayActionFailure("This engine doesn't know how to clone a Blob, " + 'use Firefox');
//     throw e;
//   }
//   request.onsuccess = function(evt) {
//     console.log('Insertion in DB successful');
//     displayActionSuccess();
//     displayPubList(store);
//   };
//   request.onerror = function() {
//     console.error('addPublication error', this.error);
//     displayActionFailure(this.error);
//   };
// }
