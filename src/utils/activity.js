// TODO Casos de prueba
// Tenía 2 vistos, los borro y ahora hay 12 nuevos -> OK
// Tenía 2 vistos, los borro y ahora hay 30 nuevos -> OK
// Tenía 2 vistos, y ahora hay 12, 10 de ellos nuevos -> OK
// Tenía 2 vistos, y ahora hay 30, 28 de ellos nuevos -> OK
// Tenía 2 vistos, borro el último y ahora hay 12, 11 de ellos nuevos -> OK
// Tenía 2 vistos, borro el primero y ahora hay 12, 11 de ellos nuevos -> OK
// Tenía 2 vistos, borro uno de ellos y ahora hay 1 -> OK
// Tenía 32 vistos, borro uno de ellos y ahora hay 31 -> OK
/**
 * Load viewing activity
 * @param {*} buildId
 * @param {*} savedViewedItems
 */
function getViewingActivity(buildId, savedViewedItems) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(savedViewedItems)) {
      return getFullActivity(buildId, resolve, reject);
    }

    const savedViewedItemsSize = savedViewedItems.length;
    debug(`Saved viewing history size is ${savedViewedItemsSize}`);
    const lastSavedItem = !_.isEmpty(savedViewedItems) ? savedViewedItems[savedViewedItemsSize - 1] : null;
    debug('Last saved viewed title', lastSavedItem);

    // Get first page of activity
    getActivityPage(0, buildId)
      .then(response => response.json())
      .then(data => {
        const viewingHistorySize = data.vhSize;
        debug(`Viewing history size is ${viewingHistorySize}`);
        if (viewingHistorySize < savedViewedItemsSize) {
          debug(
            'Viewing history size is lower than saved viewing history!. This usually means that user has remove titles from viewing activity'
          );
        }

        const newViewedItems = data.viewedItems;
        let loadedViewingHistory;

        if (lastSavedItem) {
          // Search last viewed title in retrieved activity page
          lastViewedItemIndex = _.findIndex(newViewedItems, {
            movieID: lastSavedItem.movieID,
            date: lastSavedItem.date,
          });

          if (lastViewedItemIndex !== -1) {
            debug('Last saved viewed title found');
            let newUniqueViewedItems = _.takeWhile(newViewedItems, (viewedItem, index) => {
              return index < lastViewedItemIndex;
            });
            loadedViewingHistory = savedViewedItems.concat(newUniqueViewedItems);
          } else {
            loadedViewingHistory = savedViewedItems.concat(newViewedItems);
          }
        } else {
          loadedViewingHistory = savedViewedItems.concat(newViewedItems);
        }

        if (loadedViewingHistory.length >= viewingHistorySize) {
          // Full viewing activity loaded
          resolve(_.sortBy(loadedViewingHistory, ['date']).reverse());
        } else {
          let pages = Math.ceil(viewingHistorySize / PAGE_SIZE);
          debug(`Viewing history has ${pages} pages of ${PAGE_SIZE} elements per page`);
          if (page === pages) {
            // All pages loaded
            resolve(_.sortBy(loadedViewingHistory, ['date']).reverse());
          } else {
            // Load page by page recursively until lastSavedItem is found or all the pages are loaded
            return getRecentActivity(buildId, 1, pages, lastSavedItem, loadedViewingHistory, resolve);
          }
        }
      })
      .catch(error => {
        console.error('First page of last viewing activity could not be fetched', error);
        resolve(_.sortBy(savedViewedItems, ['date']).reverse()); // Resolve with the saved data we have
      });
  });
}

/**
 * Load full viewing activity
 */
function getFullActivity(buildId, resolve, reject) {
  let viewedItems = [];

  // Get first page of activity
  getActivityPage(0, buildId)
    .then(response => response.json())
    .then(data => {
      let viewingHistorySize = data.vhSize;

      debug(`Viewing history size is ${viewingHistorySize}`);
      let pages = Math.ceil(viewingHistorySize / PAGE_SIZE);

      debug(`Viewing history has ${pages} pages of ${PAGE_SIZE} elements per page`);
      viewedItems = viewedItems.concat(data.viewedItems);

      const pageList = [];
      for (let pageNumber = 1; pageNumber < pages; pageNumber++) {
        pageList.push(pageNumber);
      }

      // Executes a request for each activity page
      const promises = pageList.map(page => {
        return getActivityPage(page, buildId)
          .then(response => response.json())
          .then(data => {
            viewedItems = viewedItems.concat(data.viewedItems);
          })
          .catch(error => console.error(`Error loading activity page ${page}`, error));
      });

      // Synchronizes when all requests are resolved
      Promise.all(promises)
        .then(response => {
          debug(`All pages loaded, viewed items: `, viewedItems);
          resolve(_.sortBy(viewedItems, ['date']).reverse());
        })
        .catch(error => {
          console.error(`Unknown error loading viewing activity pages`, error);
          reject(error);
        });
    })
    .catch(error => {
      console.error('First page of viewing activity could not be fetched', error);
      reject(error);
    });
}

/**
 * Load viewing activity recursively
 * @param {*} buildId
 * @param {*} page
 * @param {*} pages
 * @param {*} lastSavedItem
 * @param {*} loadedViewingHistory
 * @param {*} resolve
 */
function getRecentActivity(buildId, page, pages, lastSavedItem, loadedViewingHistory, resolve) {
  getActivityPage(page, buildId)
    .then(response => response.json())
    .then(data => {
      debug(`Loaded page ${page} pages of recent viewing activity`);
      page++;
      const viewingHistorySize = data.vhSize;
      const newViewedItems = data.viewedItems;

      if (lastSavedItem) {
        // Search last viewed title in retrieved activity page
        lastViewedItemIndex = _.findIndex(newViewedItems, {
          movieID: lastSavedItem.movieID,
          date: lastSavedItem.date,
        });

        if (lastViewedItemIndex !== -1) {
          debug('Last saved viewed title found');
          let newUniqueViewedItems = _.takeWhile(newViewedItems, (viewedItem, index) => {
            return index < lastViewedItemIndex;
          });
          loadedViewingHistory = loadedViewingHistory.concat(newUniqueViewedItems);
        } else {
          loadedViewingHistory = loadedViewingHistory.concat(newViewedItems);
        }
      } else {
        loadedViewingHistory = loadedViewingHistory.concat(newViewedItems);
      }

      if (loadedViewingHistory.length >= viewingHistorySize) {
        // Full viewing activity loaded
        return resolve(_.sortBy(loadedViewingHistory, ['date']).reverse());
      } else {
        if (page === pages) {
          // All pages loaded
          return resolve(_.sortBy(loadedViewingHistory, ['date']).reverse());
        } else {
          // Load page by page recursively until lastSavedItem is found or all the pages are loaded
          return getRecentActivity(buildId, page, pages, lastSavedItem, loadedViewingHistory, resolve);
        }
      }
    })
    .catch(error => {
      console.error(`Error loading page ${page} of recent viewing activity`, error);
      page++;
      if (page === pages) {
        // All viewing activity loaded
        return resolve(_.sortBy(loadedViewingHistory, ['date']).reverse());
      } else {
        // Continue trying to load more recent activity pages
        return getRecentActivity(buildId, page, pages, lastSavedItem, loadedViewingHistory, resolve);
      }
    });
}

/**
 * Load viewwing activity page
 * @param {*} page
 */
function getActivityPage(page, buildId) {
  return fetch(`https://www.netflix.com/api/shakti/${buildId}/viewingactivity?pg=${page}&pgSize=${PAGE_SIZE}`, {
    credentials: 'same-origin',
  });
}
