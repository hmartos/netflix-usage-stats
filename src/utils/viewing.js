let page = 0;
let sortBy = { date: false }; // Default sorting
let _viewingActivity;
let viewingActivityCopy;

/**
 * Create the viewing activity list on dashboard
 * @param {*} viewedItems
 */
function createViewingActivityList(viewedItems) {
  const viewingActivity = viewedItems.map(viewedItem => {
    viewedItem.showTitle = viewedItem.series
      ? `${viewedItem.seriesTitle} - ${viewedItem.title}`
      : `${viewedItem.title}`;
    viewedItem.dateFormatted = formatFullDate(viewedItem.date);
    viewedItem.durationFormatted = secondsToHoursMinutesSeconds(viewedItem.duration);
    viewedItem.type = viewedItem.series ? `${chrome.i18n.getMessage('serie')}` : `${chrome.i18n.getMessage('movie')}`;
    return viewedItem;
  });
  debug(`Viewing Activity list data`, viewingActivity);

  viewingActivityCopy = viewingActivity;
  _viewingActivity = _.cloneDeep(viewingActivity);

  showViewingActivityPage(0);
  bindShowMoreBtn(_viewingActivity);
  const columns = ['date', 'title', 'duration', 'type'];
  columns.forEach(column => {
    bindSortingHeaders(column);
  });
  bindSearch();
  bindDownloadButton(_viewingActivity);

  setSortingIcon('date');
}

/**
 * Shows viewing activity list page
 * @param {*} page - number of the page to show (starting in 0)
 */
function showViewingActivityPage(page) {
  const viewingActivityPage = _.slice(_viewingActivity, page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  renderViewingActivityList(viewingActivityPage);
  showResultsCountSummary(page);

  // Hide 'Show more' button if it's the last chunk or show it again if not
  const showMoreBtn = $('#showMoreBtn');
  if (
    viewingActivityPage.length < PAGE_SIZE ||
    (viewingActivityPage.length === PAGE_SIZE && page * PAGE_SIZE + PAGE_SIZE === _viewingActivity.length)
  ) {
    showMoreBtn.hide();
  } else {
    showMoreBtn.show();
  }
}

/**
 * Render a list of viewed items
 * @param {*} viewedItems - page of viewing activity already filtered and sorted
 */
function renderViewingActivityList(viewedItems) {
  const list = document.getElementById('viewingActivityList');
  for (const viewedItem of viewedItems) {
    const date = document.createElement('div');
    date.classList = ['col date nowrap'];
    date.innerText = viewedItem.dateFormatted;
    date.setAttribute('title', `${formatDate4Title(viewedItem.date, true)}`);

    const title = document.createElement('a');
    title.href = `/title/${viewedItem.movieID}`;
    title.innerText = viewedItem.showTitle;

    const titleContainer = document.createElement('div');
    titleContainer.classList = ['col title'];
    titleContainer.appendChild(title);

    const duration = document.createElement('div');
    duration.classList = ['col report'];
    duration.innerText = viewedItem.durationFormatted;

    const type = document.createElement('img');
    type.src =
      viewedItem.type === `${chrome.i18n.getMessage('serie')}`
        ? chrome.runtime.getURL('/images/tv.svg')
        : chrome.runtime.getURL('/images/movie.svg');
    type.className = 'ns-image-type';

    const typeContainer = document.createElement('div');
    typeContainer.classList = ['col delete'];
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
 * Show results count summary for filtered (or not) viewing activity
 * @param {*} page - number of the page to show (starting in 0)
 */
function showResultsCountSummary(page) {
  const resultsCountContainer = document.querySelector('#resultsCount span');
  const resultsCount = document.createElement('span');

  const startRange = _viewingActivity.length ? page * PAGE_SIZE + 1 : 0;
  const endRange =
    page * PAGE_SIZE + PAGE_SIZE < _viewingActivity.length ? page * PAGE_SIZE + PAGE_SIZE : _viewingActivity.length;

  resultsCount.textContent = `${chrome.i18n.getMessage('showing')} ${startRange} - ${endRange} of ${
    _viewingActivity.length
  } ${chrome.i18n.getMessage('results')}`;

  resultsCountContainer.replaceWith(resultsCount);

  debug(`Showing results ${startRange} - ${endRange} of ${_viewingActivity.length} results`);
}

/**
 * Show a download link to export the viewing activity in CSV format
 * @param {*} viewingActivity
 */
function bindDownloadButton(viewingActivity) {
  try {
    const fields = [
      {
        label: 'Timestamp',
        value: row => new Date(row['date']).toISOString(),
      },
      {
        label: 'Title',
        value: 'showTitle',
      },
      {
        label: 'Duration',
        value: 'durationFormatted',
      },
      {
        label: 'Duration (s)',
        value: 'duration',
      },
      {
        label: 'Type',
        value: 'type',
      },
      {
        label: 'Movie ID',
        value: row => row['movieID'].toString(),
      },
      {
        label: 'Top Node ID',
        value: 'topNodeId',
      },
      {
        label: 'Device Type',
        value: row => row['deviceType'].toString(),
      },
      {
        label: 'Country',
        value: 'country',
      },
    ];
    const csv = json2csv.parse(viewingActivity, { fields, escapedQuote: "'" });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const downloadLink = document.querySelector('#downloadLink');
    downloadLink.setAttribute('href', URL.createObjectURL(blob));
    downloadLink.setAttribute('download', `${chrome.i18n.getMessage('viewingActivity')}.csv`);
    downloadLink.innerHTML = `${chrome.i18n.getMessage('download')}`;
  } catch (error) {
    console.error('Error showing download button to export viewing activity', error);
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
    showViewingActivityPage(page);
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
    showViewingActivityPage(page);
  });
}

/**
 * Filter viewing activity by title
 * @param {*} search - search input value
 */
function filterViewingActivity(search) {
  debug('Search value', search);

  if (_.isEmpty(search)) {
    _viewingActivity = _.cloneDeep(viewingActivityCopy);
  } else {
    _viewingActivity = _.filter(viewingActivityCopy, item => {
      return _.includes(_.toLower(_.deburr(item.showTitle)), _.toLower(_.deburr(search)));
    });
    debug('Filtered viewing actitvity', _viewingActivity);
  }
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

      filterViewingActivity(search);
      clearViewingActivityList();
      showViewingActivityPage(0);
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
  // When sorting by column 'title' sort by 'showTitle'
  if (column === 'title') {
    column = 'showTitle';
  }

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
