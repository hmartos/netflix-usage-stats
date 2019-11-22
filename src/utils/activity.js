/**
 * Load viewing activity
 */
function getActivity(buildId) {
  return new Promise((resolve, reject) => {
    let viewedItems = [];

    // Get first page of activity
    getActivityPage(0, buildId)
      .then(response => response.json())
      .then(data => {
        let count = data.vhSize;

        debug(`Viewing history size is ${count}`);
        let pages = Math.ceil(count / PAGE_SIZE);

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
        console.error('First page of viewing activity could not be fetched');
        throw error;
      });
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
