/**
 * Load viewing activity
 * @param {*} buildId
 * @param {*} savedViewedItems
 */
function getViewingActivity(buildId, savedViewedItems) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(savedViewedItems)) {
      debug(`Saved viewing history is empty, loading full activity...`);
      return getFullActivity(buildId, resolve, reject);
    }

    const savedViewedItemsSize = savedViewedItems.length;
    debug(`Saved viewing history size is ${savedViewedItemsSize}`);
    const lastSavedItem = savedViewedItems[savedViewedItemsSize - 1];
    debug('Last saved viewed title', lastSavedItem);

    // Get first page of activity
    getActivityPage(0, buildId)
      .then(response => response.json())
      .then(data => {
        let page = 1;
        debug(`Loaded page ${page} of recent viewing activity`);

        const viewingHistorySize = data.vhSize;
        debug(`Viewing history size is ${viewingHistorySize}`);
        if (viewingHistorySize < savedViewedItemsSize) {
          debug(
            'Viewing history size is lower than saved viewing history!. This usually means that user has remove titles from viewing activity'
          );
        }

        const newViewedItems = data.viewedItems;
        let loadedViewingHistory = savedViewedItems;

        // Add only new viewed titles to the viewing history
        let newUniqueViewedItems = _.takeWhile(newViewedItems, (viewedItem, index) => {
          return (
            _.findIndex(savedViewedItems, {
              movieID: viewedItem.movieID,
              date: viewedItem.date,
            }) === -1
          );
        });
        loadedViewingHistory = loadedViewingHistory.concat(newUniqueViewedItems);

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
            return getRecentActivity(buildId, page, pages, lastSavedItem, loadedViewingHistory, resolve);
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
  let loadedPages = 0;

  // Get first page of activity
  getActivityPage(0, buildId)
    .then(response => response.json())
    .then(data => {
      loadedPages++;
      let viewingHistorySize = data.vhSize;

      debug(`Viewing history size is ${viewingHistorySize}`);
      let pages = Math.ceil(viewingHistorySize / PAGE_SIZE);

      debug(`Viewing history has ${pages} pages of ${PAGE_SIZE} elements per page`);
      viewedItems = viewedItems.concat(data.viewedItems);
      updateLoadingProgress(loadedPages, pages);

      const pageList = [];
      for (let pageNumber = 1; pageNumber < pages; pageNumber++) {
        pageList.push(pageNumber);
      }

      // Executes a request for each activity page
      const promises = pageList.map(page => {
        return getActivityPage(page, buildId)
          .then(response => response.json())
          .then(data => {
            loadedPages++;
            viewedItems = viewedItems.concat(data.viewedItems);
            updateLoadingProgress(loadedPages, pages);
          })
          .catch(error => {
            loadedPages++;
            console.error(`Error loading activity page ${page}`, error);
            updateLoadingProgress(loadedPages, pages);
          });
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
      debug(`Loaded page ${page} of recent viewing activity`);
      page++;
      const viewingHistorySize = data.vhSize;
      const newViewedItems = data.viewedItems;

      let newUniqueViewedItems = _.takeWhile(newViewedItems, (viewedItem, index) => {
        return (
          _.findIndex(loadedViewingHistory, {
            movieID: viewedItem.movieID,
            date: viewedItem.date,
          }) === -1
        );
      });
      loadedViewingHistory = loadedViewingHistory.concat(newUniqueViewedItems);

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

/**
 * Update viewing activity loading progress
 * @param {*} loadedPages
 * @param {*} pages
 */
function updateLoadingProgress(loadedPages, pages) {
  try {
    let progress = Math.ceil((loadedPages / pages) * 100);
    console.log('Loading progress', progress);

    let loadingProgress = document.querySelector('.ns-loading-progress');
    loadingProgress.innerText = `${progress}%`;
  } catch (error) {
    console.error('Error updating loading progress', error);
  }
}
