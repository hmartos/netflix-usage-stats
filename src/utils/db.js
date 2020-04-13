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
    // Make a request to open the database
    let openRequest = indexedDB.open(dbName, DB_VERSION);

    openRequest.onsuccess = function(event) {
      let db = event.target.result;
      debug('Successfully opened DB', event);

      // Make a request to get the viewing activity from the object store
      let getRequest = db
        .transaction(DB_STORE_NAME)
        .objectStore(DB_STORE_NAME)
        .getAll();

      getRequest.onsuccess = function(event) {
        debug('Successfully retrieved saved items from indexedDb', event.target.result);
        resolve(event.target.result);
      };

      getRequest.onerror = function(event) {
        console.error('Error retrieving saved items from indexedDb', event);
        resolve([]); // Resolve with empty array to load the full activity
      };
    };

    openRequest.onerror = function(event) {
      console.error('Request error opening DB', event);
      resolve([]); // Resolve with empty array to load the full activity
    };

    openRequest.onupgradeneeded = function(event) {
      createObjectStore(event);
    };
  });
}

/**
 * Save loaded viewing activity for the next visit
 * @param {*} profileId
 * @param {*} viewedItems
 */
function saveViewingActivity(profileId, savedViewedItems, viewedItems) {
  const dbName = `${DB_NAME}_${profileId}`;
  debug('Opening DB...');
  // Make a request to open the database
  let openRequest = indexedDB.open(dbName, DB_VERSION);

  openRequest.onsuccess = function(event) {
    let db = event.target.result;
    debug('Successfully opened DB', event);
    let newViewedItems = _.differenceBy(
      viewedItems,
      savedViewedItems,
      viewedItem => `${viewedItem.movieId}_${viewedItem.date}`
    );
    saveViewedItems(db, newViewedItems);
  };

  openRequest.onerror = function(event) {
    console.error('Error opening DB. Error code', event.target.errorCode);
  };

  openRequest.onupgradeneeded = function(event) {
    createObjectStore(event);
  };
}

/**
 * Create an objectStore
 * @param {*} event
 */
function createObjectStore(event) {
  debug('DB not exist or version has changed. Creating objectStore', DB_STORE_NAME, event);
  let store = event.currentTarget.result.createObjectStore(DB_STORE_NAME, {
    keyPath: ['date', 'movieID'],
  });

  //store.createIndex('movieID', 'movieID', { unique: false });
  debug('Successfully created objectStore', DB_STORE_NAME);
}

/**
 * Save viewed items in an asynchronous fashion
 * @param {*} db
 * @param {*} viewedItems
 */
function saveViewedItems(db, viewedItems) {
  // Make a transaction to save viewedItems
  let transaction = db.transaction([DB_STORE_NAME], 'readwrite');

  transaction.oncomplete = function(event) {
    debug('Successfully saved viewedItems in indexedDb', event);
  };

  transaction.onerror = function(event) {
    console.error('Transaction error saving viewing activity in indexedDb', event);
  };

  // Make a request to insert every viewed item into the object store
  let objectStore = transaction.objectStore(DB_STORE_NAME);
  // TODO https://stackoverflow.com/questions/10471759/inserting-large-quantities-in-indexeddbs-objectstore-blocks-ui
  viewedItems.forEach(function(viewedItem) {
    let request = objectStore.add(viewedItem);

    request.onsuccess = function(event) {
      //debug('Successfully saved viewed item in indexedDb', viewedItem, event);
    };

    request.onerror = function(event) {
      console.error('Request error saving viewed item in indexedDb', viewedItem, event);
    };
  });
}
