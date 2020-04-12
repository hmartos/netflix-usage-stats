/**
 * Load full viewing activity
 */
function getFullActivity(buildId) {
  return new Promise((resolve, reject) => {
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
  });
}

/**
 * Load last viewing activity and add it to the saved activity
 */
function getLastActivity(buildId, savedViewedItems) {
  //TODO Ya no se pueden lanzar todas las páginas a la vez, sino que hay que hay que cargarla una a una
  // Hay que revisar para cada uno de los 20 elementos de cada página si coincide con el último elemento
  // Para que haya coincidencia debe coincidir el movieID y el date
  // ¿Qué pasa si el usuario ha borrado de la actividad de visionado el último elemento visto? --> Ya no lo vamos a encontrar
  // Pero estará el anterior!!! y si no el anterior, y si no el anterior... y si no estará vacía
  // Si se borran títulos anteriores no hay problema, en el dashboard seguirán apareciendo
  // Si se borran títulos no sincronizados aún no hay problema, no vendrán desde la API
  // Se puede cargar la información de la API mientras el date del último elemento de cada página sea mayor al date del último elemento guardado
  // Cuando esto suceda hay que eliminar los elementos de la última página cargada que ya estuvieran guardados en la db
  // Esto también se puede hacer por date

  // Casos de prueba
  // Tenía 2 vistos, los borro y ahora hay 12 nuevos -> OK
  // Tenía 2 vistos, los borro y ahora hay 30 nuevos -> OK
  // Tenía 2 vistos, y ahora hay 12, 10 de ellos nuevos -> OK
  // Tenía 2 vistos, y ahora hay 30, 28 de ellos nuevos -> OK
  // Tenía 2 vistos, borro el último y ahora hay 12, 11 de ellos nuevos -> OK
  // Tenía 2 vistos, borro el primero y ahora hay 12, 11 de ellos nuevos -> OK
  // Tenía 2 vistos, borro uno de ellos y ahora hay 1 -> OK
  // Tenía 32 vistos, borro uno de ellos y ahora hay 31 ->

  //TODO Ordenar en los resolves!!
  return new Promise((resolve, reject) => {
    const savedViewedItemsSize = savedViewedItems.length;
    debug(`Saved viewing history size is ${savedViewedItemsSize}`);
    const lastSavedItem = savedViewedItems[0];
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

        // Search last viewed title in retrieved activity page
        lastViewedItemIndex = _.findIndex(newViewedItems, {
          movieID: lastSavedItem.movieID,
          date: lastSavedItem.date,
        });

        let loadedViewingHistory;
        if (lastViewedItemIndex !== -1) {
          debug('Last saved viewed title found');
          let newUniqueViewedItems = _.takeWhile(newViewedItems, (viewedItem, index) => {
            return index < lastViewedItemIndex; // TODO REVIEW!!!
          });
          loadedViewingHistory = savedViewedItems.concat(newUniqueViewedItems);
        } else {
          loadedViewingHistory = savedViewedItems.concat(newViewedItems);
        }

        if (loadedViewingHistory.length >= viewingHistorySize) {
          // Full viewing activity loaded
          resolve(loadedViewingHistory);
        } else {
          let pages = Math.ceil(viewingHistorySize / PAGE_SIZE);
          debug(`Viewing history has ${pages} pages of ${PAGE_SIZE} elements per page`);
          if (page === pages) {
            // All pages loaded
            resolve(loadedViewingHistory);
          } else {
            // Load page by page recursively until lastSavedItem is found or all the pages are loaded
            return getRecentActivity(buildId, 1, pages, lastSavedItem, loadedViewingHistory, resolve);
          }
        }
      })
      .catch(error => {
        console.error('First page of last viewing activity could not be fetched', error);
        resolve(savedViewedItems); // Resolve with the saved data we have
      });
  });
}

function getRecentActivity(buildId, page, pages, lastSavedItem, loadedViewingHistory, resolve) {
  getActivityPage(page, buildId)
    .then(response => response.json())
    .then(data => {
      debug(`Loaded page ${page} pages of recent viewing activity`);
      page++;
      const viewingHistorySize = data.vhSize;
      const newViewedItems = data.viewedItems;

      // Search last viewed title in retrieved activity page
      lastViewedItemIndex = _.findIndex(newViewedItems, {
        movieID: lastSavedItem.movieID,
        date: lastSavedItem.date,
      });

      let loadedViewingHistory;
      if (lastViewedItemIndex !== -1) {
        debug('Last saved viewed title found');
        let newUniqueViewedItems = _.takeWhile(newViewedItems, (viewedItem, index) => {
          return index < lastViewedItemIndex; // TODO REVIEW!!!
        });
        loadedViewingHistory = savedViewedItems.concat(newUniqueViewedItems);
      } else {
        loadedViewingHistory = savedViewedItems.concat(newViewedItems);
      }

      if (loadedViewingHistory.length >= viewingHistorySize) {
        // Full viewing activity loaded
        return resolve(loadedViewingHistory);
      } else {
        if (page === pages) {
          // All pages loaded
          return resolve(loadedViewingHistory);
        } else {
          // Load page by page recursively until lastSavedItem is found or all the pages are loaded
          return getRecentActivity(buildId, 1, pages, lastSavedItem, loadedViewingHistory, resolve);
        }
      }
    })
    .catch(error => {
      console.log(`Error loading page ${page} of recent viewing activity`, error);
      page++;
      if (page === pages) {
        // All viewing activity loaded
        return resolve(loadedViewingHistory);
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
