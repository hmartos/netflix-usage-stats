let page = 0;
let sortBy = { date: false }; // Default sorting
let _viewingActivity;
let viewingActivityCopy;

// TODO JS Doc on functions headers

/**
 * Create the viewing activity list on dashboard
 * @param {*} viewedItems
 */
function createViewingActivityList(viewedItems) {
  const viewingActivity = viewedItems.map(viewedItem => {
    viewedItem.title = viewedItem.series ? `${viewedItem.seriesTitle} - ${viewedItem.title}` : `${viewedItem.title}`;
    viewedItem.dateFormatted = formatFullDate(viewedItem.date);
    viewedItem.durationFormatted = secondsToHoursMinutesSeconds(viewedItem.duration);
    viewedItem.type = viewedItem.series ? `${chrome.i18n.getMessage('serie')}` : `${chrome.i18n.getMessage('movie')}`;
    return viewedItem;
  });
  debug(`Viewing Activity list data`, viewingActivity);

  viewingActivityCopy = viewingActivity;
  _viewingActivity = _.cloneDeep(viewingActivity);

  renderViewingActivityList(_.slice(_viewingActivity, 0, PAGE_SIZE));
  bindShowMoreBtn(_viewingActivity);
  const columns = ['date', 'title', 'duration', 'type'];
  columns.forEach(column => {
    bindSortingHeaders(column);
  });
  bindSearch();

  setSortingIcon('date');
}

/**
 * Shows viewing activity list page
 * @param {*} viewedItems - page of viewing activity already filtered and sorted
 */
function renderViewingActivityList(viewedItems) {
  const list = document.getElementById('viewingActivityList');
  for (const viewedItem of viewedItems) {
    const date = document.createElement('div');
    date.classList = ['col ns-date-col'];
    date.innerText = viewedItem.dateFormatted;

    const title = document.createElement('a');
    title.href = `/title/${viewedItem.movieID}`;
    title.innerText = viewedItem.title;

    const titleContainer = document.createElement('div');
    titleContainer.classList = ['col ns-title-col'];
    titleContainer.appendChild(title);

    const duration = document.createElement('div');
    duration.classList = ['col ns-duration-col'];
    duration.innerText = viewedItem.durationFormatted;

    const type = document.createElement('i');
    type.classList = ['material-icons ns-icon'];
    type.innerText = viewedItem.type === 'Movie' ? 'local_movies' : 'tv';

    const typeContainer = document.createElement('div');
    typeContainer.classList = ['col ns-type-col'];
    typeContainer.appendChild(type);

    const listItem = document.createElement('li');
    listItem.className = 'retableRow';
    listItem.appendChild(date);
    listItem.appendChild(titleContainer);
    listItem.appendChild(duration);
    listItem.appendChild(typeContainer);

    list.appendChild(listItem);
  }
}

/**
 * Bind on click event on 'Show more' button
 */
function bindShowMoreBtn() {
  const showMoreBtn = $('#showMoreBtn');
  showMoreBtn.html(chrome.i18n.getMessage('showMore'));
  showMoreBtn.on('click', function() {
    page++;
    renderViewingActivityList(_.slice(_viewingActivity, page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
    // TODO Hide button if it is the last chunk
  });
}

/**
 * Bind on click event on sorting header
 * @param {*} column
 */
function bindSortingHeaders(column) {
  const header = $(`#viewingActivity${_.capitalize(column)}Header`);

  header.html(chrome.i18n.getMessage(column));
  header.on('click', function() {
    setSorting(column);
    sortViewingActivity(column, sortBy[column]);
    clearViewingActivityList();
    renderViewingActivityList(_.slice(_viewingActivity, page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
  });
}

/**
 * Bind on key up event on the search input
 */
function bindSearch() {
  const searchInput = $('#search');

  searchInput.prop('placeholder', `${chrome.i18n.getMessage('search')}...`);

  searchInput.on(
    'keyup',
    _.debounce(function() {
      const search = searchInput.prop('value');
      debug('Search value', search);

      if (_.isEmpty(search)) {
        _viewingActivity = _.cloneDeep(viewingActivityCopy);
      } else {
        _viewingActivity = _.filter(viewingActivityCopy, item => {
          return _.includes(_.toLower(item.title), _.toLower(_.deburr(search)));
        });
        debug('Filtered viewing actitvity', _viewingActivity);
      }

      clearViewingActivityList();
      renderViewingActivityList(_.slice(_viewingActivity, page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
    }, 150)
  );
}

/**
 * Set sorting column model
 * @param {*} column
 */
function setSorting(column) {
  if (_.has(sortBy, column)) {
    sortBy[column] = !sortBy[column];
  } else {
    sortBy = {};
    sortBy[column] = true;
  }

  clearSortingIcon();
  setSortingIcon(column);
}

/**
 * Show arrow icon (up or down) on sorting header
 * @param {*} column
 */
function setSortingIcon(column) {
  let icon = document.createElement('i');
  icon.classList = ['material-icons ns-sort-icon'];
  if (!!sortBy[column]) {
    icon.innerText = 'arrow_drop_down';
  } else {
    icon.innerText = 'arrow_drop_up';
  }

  let sortColumn = document.getElementById(`viewingActivity${_.capitalize(column)}Header`);
  sortColumn.appendChild(icon);
}

/**
 * Sort viewing activity list
 * @param {*} column
 * @param {*} ascending - true ascending, false descending
 */
function sortViewingActivity(column, ascending) {
  _viewingActivity = _.sortBy(_viewingActivity, column);
  if (!ascending) {
    _viewingActivity.reverse();
  }
  debug('Sorted viewing actitivy', _viewingActivity);
}

/**
 * Clear viewing activity list
 */
function clearViewingActivityList() {
  page = 0;
  const list = document.getElementById('viewingActivityList');
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
}

/**
 * Clear icon on sorting header
 */
function clearSortingIcon() {
  const dateHeader = document.querySelector('#viewingActivityDateHeader i');
  const titleHeader = document.querySelector('#viewingActivityTitleHeader i');
  const durationHeader = document.querySelector('#viewingActivityDurationHeader i');
  const typeHeader = document.querySelector('#viewingActivityTypeHeader i');

  if (dateHeader) {
    dateHeader.remove();
  } else if (titleHeader) {
    titleHeader.remove();
  } else if (durationHeader) {
    durationHeader.remove();
  } else if (typeHeader) {
    typeHeader.remove();
  }
}
