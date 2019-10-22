'use strict';

const DEBUG_MODE = true;
const PAGE_SIZE = 20;
const summary = {
  viewedItemsCount: 0,
  totalTime: 0,
  maxTimeInDate: 0,
  deviceCount: 0,
  moviesCount: 0,
  moviesTime: 0,
  seriesCount: 0,
  episodesCount: 0,
  seriesTime: 0,
};
const WEEK_DAYS = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
const MONTHS = {
  0: 'January',
  1: 'February',
  2: 'March',
  3: 'April',
  4: 'May',
  5: 'June',
  6: 'July',
  7: 'August',
  8: 'September',
  9: 'October',
  10: 'November',
  11: 'December',
};

let BUILD_IDENTIFIER;

// MAIN
document.documentElement.style.visibility = 'hidden';
window.addEventListener('unhandledrejection', function(promiseRejectionEvent) {
  console.error(
    `Something went wrong, sorry... but here is a trace that could help to fix the problem`,
    promiseRejectionEvent
  );
  showEmptyOrErrorSection(promiseRejectionEvent);
});
document.addEventListener('DOMContentLoaded', function() {
  document.documentElement.style.visibility = '';
  try {
    main();
  } catch (error) {
    console.error(
      `Something went wrong, sorry... but here is a trace that could help to fix the problem`,
      error
    );
    showEmptyOrErrorSection(error);
  }
});

// FUNCTIONS
function main() {
  setupStatsPage();

  showLoader();

  // Load HTML page
  fetch(chrome.extension.getURL('/stats.html'))
    .then(response => response.text())
    .then(statsTemplate => {
      // Get viewing activity
      getActivity()
        .then(viewedItems => {
          hideLoader(statsTemplate);

          translatePage();

          if (_.isEmpty(viewedItems)) {
            showEmptyOrErrorSection();
          } else {
            calculateStats(viewedItems);

            showStats(viewedItems);
          }
        })
        .catch(error => {
          console.error(
            'Error loading viewing activity and calculating stats',
            error
          );
          throw error;
        });
    })
    .catch(error => {
      console.error('Error loading stats.html template', error);
      throw error;
    });
}

/**
 * Clear activity page to be used as the skeleton for stats page
 */
function setupStatsPage() {
  BUILD_IDENTIFIER = getNetflixBuildId();
  debug(`Netflix BUILD_IDENTIFIER: ${BUILD_IDENTIFIER}`);

  // Change page title
  document.querySelector('h1').textContent = chrome.i18n.getMessage(
    'myViewingStats'
  );

  // Remove watched/rated tabs
  let tabs = document.querySelector('.pageToggle');
  if (tabs) {
    tabs.remove();
  }

  // Remove viewing activity footer
  let footer = document.querySelector('.viewing-activity-footer');
  if (footer) {
    footer.remove();
  }

  // Set default font for charts
  Chart.defaults.global.defaultFontFamily = 'Netflix Sans';
}

/**
 * Get Netlfix Build ID
 */
function getNetflixBuildId() {
  const scripts = Array.prototype.slice.call(document.scripts);
  let buildId = null;

  scripts.forEach((script, index) => {
    const buildIdIndex = script.innerHTML.indexOf('BUILD_IDENTIFIER');
    if (buildIdIndex > -1) {
      const text = script.innerHTML.substring(buildIdIndex + 19);
      buildId = text.substring(0, text.indexOf('"'));
    }
  });

  return buildId;
}

/**
 * Load viewing activity
 */
function getActivity() {
  return new Promise((resolve, reject) => {
    let viewedItems = [];

    // Get first page of activity
    getActivityPage(0)
      .then(response => response.json())
      .then(data => {
        let count = data.vhSize;

        debug(`Viewing history size is ${count}`);
        let pages = Math.ceil(count / PAGE_SIZE);

        debug(
          `Viewing history has ${pages} pages of ${PAGE_SIZE} elements per page`
        );
        viewedItems = viewedItems.concat(data.viewedItems);

        const pageList = [];
        for (let pageNumber = 1; pageNumber < pages; pageNumber++) {
          pageList.push(pageNumber);
        }

        // Executes a request for each activity page
        const promises = pageList.map(page => {
          return getActivityPage(page)
            .then(response => response.json())
            .then(data => {
              viewedItems = viewedItems.concat(data.viewedItems);
            })
            .catch(error =>
              console.error(`Error loading activity page ${page}`, error)
            );
        });

        // Synchronizes when all requests are resolved
        Promise.all(promises)
          .then(response => {
            debug(`All pages loaded, viewed items: `, viewedItems);
            resolve(_.sortBy(viewedItems, ['date']).reverse());
          })
          .catch(error => {
            console.error(
              `Unknown error loading viewing activity pages`,
              error
            );
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
function getActivityPage(page) {
  // If BUILD_IDENTIFIER couldn't be retrieved, fallback to last working BUILD_IDENTIFIER
  let buildId = BUILD_IDENTIFIER ? BUILD_IDENTIFIER : 'v8056e71b';
  return fetch(
    `https://www.netflix.com/api/shakti/${buildId}/viewingactivity?pg=${page}&pgSize=${PAGE_SIZE}`,
    { credentials: 'same-origin' }
  );
}

/**
 * Calculate stats based on viewed items
 * @param {*} viewedItems
 */
function calculateStats(viewedItems) {
  // Time by date
  const timeByDayGroup = _.groupBy(viewedItems, viewedItem => {
    return getDate(viewedItem);
  });

  const timeByDay = _.reduce(
    timeByDayGroup,
    (result, value, key) => {
      const duration = _.sumBy(value, 'duration');
      result[key] = duration;
      return result;
    },
    {}
  );

  debug('Time by day', timeByDay);

  const maxTimeInDate = _.maxBy(_.values(timeByDay));
  const maxTimeInDateDate = _.findKey(timeByDay, timeByDay => {
    return timeByDay === maxTimeInDate;
  });
  debug('Max time in a day ' + maxTimeInDate, secondsToYdhms(maxTimeInDate));
  debug('Date of max time in a day', maxTimeInDateDate);

  // Time by day week
  const meanTimeByDayWeekGroup = _.groupBy(viewedItems, viewedItem => {
    return new Date(viewedItem.date).getDay();
  });

  const meanTimeByDayWeek = _.reduce(
    meanTimeByDayWeekGroup,
    (result, value, key) => {
      const timeByDate = _.reduce(
        _.groupBy(value, getDate),
        (result, value, key) => {
          result[key] = _.sumBy(value, 'duration');
          return result;
        },
        {}
      );

      result[WEEK_DAYS[key]] = (
        _.sum(_.values(timeByDate)) / _.size(timeByDate)
      ).toFixed();
      return result;
    },
    {}
  );

  debug('Mean time by day week', meanTimeByDayWeek);

  // Episodes
  const episodes = _.filter(viewedItems, function(item) {
    return _.has(item, 'series');
  });
  debug('Episodes', episodes);

  // Series
  const series = _.groupBy(episodes, 'seriesTitle');
  debug('Series', series);

  // Device Types
  const deviceTypes = _.groupBy(viewedItems, 'deviceType');
  debug('deviceTypes', deviceTypes);

  // Movies
  const movies = _.filter(viewedItems, function(item) {
    return !_.has(item, 'series');
  });
  debug('Movies', movies);

  summary.viewedItemsCount = viewedItems.length;
  summary.firstUse = new Date(viewedItems[viewedItems.length - 1]['date']);
  summary.totalTime = _.sumBy(viewedItems, 'duration');
  summary.maxTimeInDate = maxTimeInDate;
  summary.maxTimeInDateDate = maxTimeInDateDate;
  summary.deviceCount = Object.keys(deviceTypes).length;
  summary.moviesCount = movies.length;
  summary.moviesTime = _.sumBy(movies, 'duration');
  summary.episodesCount = episodes.length;
  summary.seriesCount = Object.keys(series).length;
  summary.seriesTime = _.sumBy(episodes, 'duration');
  summary.meanTimeByDayWeek = meanTimeByDayWeek;

  debug(`Time spent on Netflix: ${secondsToYdhms(summary.totalTime)}`);
  debug(`Time spent on Movies: ${secondsToYdhms(summary.moviesTime)}`);
  debug(`Time spent on Series: ${secondsToYdhms(summary.seriesTime)}`);
  debug('Activity Summary', summary);
}

/**
 * Show stats in stats template
 */
function showStats(viewedItems) {
  // Summary
  document.querySelector(
    '#viewedItemsCount .ns-number'
  ).textContent = formatNumber(summary.viewedItemsCount);
  document.querySelector(
    '#viewedItemsCount .ns-extra-info'
  ).textContent = `(${chrome.i18n.getMessage('since')} ${formatDate(
    summary.firstUse
  )})`;
  document.querySelector(
    '#viewedItemsCount .ns-extra-info'
  ).title = `${formatDate4Title(summary.firstUse)}`;
  document.querySelector('#totalTime .ns-time').textContent = secondsToYdhms(
    summary.totalTime
  );
  document.querySelector(
    '#maxTimeInDate .ns-time'
  ).textContent = secondsToYdhms(summary.maxTimeInDate);
  document.querySelector(
    '#maxTimeInDate .ns-extra-info'
  ).textContent = `(${formatDate(summary.maxTimeInDateDate)})`;
  document.querySelector(
    '#maxTimeInDate .ns-extra-info'
  ).title = `${formatDate4Title(summary.maxTimeInDateDate)}`;
  document.querySelector('#deviceCount .ns-number').textContent = formatNumber(
    summary.deviceCount
  );

  // Movies
  document.querySelector('#moviesCount .ns-number').textContent = formatNumber(
    summary.moviesCount
  );
  document.querySelector('#moviesTime .ns-time').textContent = secondsToYdhms(
    summary.moviesTime
  );

  // Series
  document.querySelector('#seriesCount .ns-number').textContent = formatNumber(
    summary.seriesCount
  );
  document.querySelector(
    '#seriesCount .ns-extra-info'
  ).textContent = `(${formatNumber(
    summary.episodesCount
  )} ${chrome.i18n.getMessage('episodes')})`;
  document.querySelector('#seriesTime .ns-time').textContent = secondsToYdhms(
    summary.seriesTime
  );

  // Charts
  createTvVsseriesTimeChart();
  createMeanTimeByWeekDayChart();

  // DataTable
  createDatatable(viewedItems);
}

/**
 * Format time from seconds to years, days, hours, minutes and seconds
 * @param {*} seconds
 */
function secondsToYdhms(seconds) {
  seconds = Number(seconds);
  const y = Math.floor(seconds / 31536000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const yDisplay =
    y > 0
      ? y +
        (y === 1
          ? ` ${chrome.i18n.getMessage('year')}, `
          : ` ${chrome.i18n.getMessage('year')}s, `)
      : '';
  const dDisplay =
    d > 0
      ? d +
        (d === 1
          ? ` ${chrome.i18n.getMessage('day')}, `
          : ` ${chrome.i18n.getMessage('day')}s, `)
      : '';
  const hDisplay =
    h > 0 || (d > 0 && h === 0)
      ? h +
        (h === 1
          ? ` ${chrome.i18n.getMessage('hour')}, `
          : ` ${chrome.i18n.getMessage('hour')}s, `)
      : '';
  const mDisplay =
    m > 0 || (h > 0 && m === 0)
      ? m +
        (m === 1
          ? ` ${chrome.i18n.getMessage('minute')}, `
          : ` ${chrome.i18n.getMessage('minute')}s, `)
      : '';
  const sDisplay =
    s +
    (s === 1
      ? ` ${chrome.i18n.getMessage('second')}`
      : ` ${chrome.i18n.getMessage('second')}s`);
  return yDisplay + dDisplay + hDisplay + mDisplay + sDisplay;
}

/**
 * Format duration from seconds to minutes
 * @param {*} seconds
 */
function secondsToHoursMinutesSeconds(seconds, showZero = false) {
  const durationFormatted = new Date(seconds * 1000)
    .toISOString()
    .substr(11, 8);
  if (durationFormatted === '00:00:00') {
    if (showZero) {
      return '0';
    }
    return 'N/A';
  } else if (durationFormatted.startsWith('00')) {
    return durationFormatted.substr(3, 5);
  } else {
    return durationFormatted;
  }
}

/**
 * Create time watching movies vs series pie chart
 */
function createTvVsseriesTimeChart() {
  // Generates chart
  var ctx = document.getElementById('moviesVsTvTimeChart');
  var myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [
        `${chrome.i18n.getMessage('movies')}`,
        `${chrome.i18n.getMessage('series')}`,
      ],
      datasets: [
        {
          data: [summary.moviesTime, summary.seriesTime],
          backgroundColor: ['rgb(178, 7, 16)', 'rgb(229, 9, 20)'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            return ` ${chrome.i18n.getMessage('timeWatching')} ${data.labels[
              tooltipItem.index
            ].toLowerCase()}:`;
          },
          footer: function(tooltipItems, data) {
            return [
              `${secondsToYdhms(data.datasets[0].data[tooltipItems[0].index])}`,
            ];
          },
        },
      },
    },
  });
}

/**
 * Create mean time watching Netflix by week day bar chart
 */
function createMeanTimeByWeekDayChart() {
  var ctx = document.getElementById('meanTimeByWeekDayChart');
  var myBarChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: [
        chrome.i18n.getMessage('Monday'),
        chrome.i18n.getMessage('Tuesday'),
        chrome.i18n.getMessage('Wednesday'),
        chrome.i18n.getMessage('Thursday'),
        chrome.i18n.getMessage('Friday'),
        chrome.i18n.getMessage('Saturday'),
        chrome.i18n.getMessage('Sunday'),
      ],
      datasets: [
        {
          label: chrome.i18n.getMessage(
            'avgTimeWatchingNetflixPerDayOfTheWeek'
          ),
          data: [
            summary.meanTimeByDayWeek['Monday'],
            summary.meanTimeByDayWeek['Tuesday'],
            summary.meanTimeByDayWeek['Wednesday'],
            summary.meanTimeByDayWeek['Thursday'],
            summary.meanTimeByDayWeek['Friday'],
            summary.meanTimeByDayWeek['Saturday'],
            summary.meanTimeByDayWeek['Sunday'],
          ],
          backgroundColor: '#e50914',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: true,
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            return ` ${secondsToYdhms(tooltipItem.value)}`;
          },
        },
      },
      scales: {
        xAxes: [
          {
            ticks: {
              stepSize: 1800,
              callback: function(value) {
                return `${secondsToHoursMinutesSeconds(value, true)}`;
              },
            },
          },
        ],
      },
    },
  });
}

/**
 * Create datatable
 */
function createDatatable(viewedItems) {
  const dataset = viewedItems.map(viewedItem => {
    viewedItem.title = viewedItem.series
      ? `${viewedItem.seriesTitle} - ${viewedItem.title}`
      : `${viewedItem.title}`;
    viewedItem.dateFormatted = formatFullDate(viewedItem.date);
    viewedItem.durationFormatted = secondsToHoursMinutesSeconds(
      viewedItem.duration
    );
    viewedItem.type = viewedItem.series
      ? `${chrome.i18n.getMessage('serie')}`
      : `${chrome.i18n.getMessage('movie')}`;
    return viewedItem;
  });
  debug(`Datatable data`, dataset);

  const datatable = $('#activityDataTable').DataTable({
    data: dataset,
    columns: [
      { data: 'title' },
      { data: 'date' },
      { data: 'date' }, // To pass the date in milliseconds to renderDateColumn function
      { data: 'duration' },
      { data: 'durationFormatted' },
      { data: 'type' },
    ],
    columnDefs: [
      { targets: [0], className: 'dt-body-left', render: renderTitleColumn },
      { targets: [1], visible: false, searchable: false }, // Hide column date and make it not searchable
      { targets: [2], orderData: 1, render: renderDateColumn }, // Order column dateFormatted by hidden column date
      { targets: [3], visible: false, searchable: false }, // Hide column duration and make it not searchable
      {
        targets: [4],
        orderData: 3,
        className: 'dt-body-right',
        render: renderDurationColumn,
      }, // Order column durationFormatted by hidden column duration
      { targets: [5], render: renderTypeColumn },
    ],
    order: [[1, 'desc']],
    language: {
      processing: `${chrome.i18n.getMessage('processing')}`,
      search: `${chrome.i18n.getMessage('search')}`,
      lengthMenu: `${chrome.i18n.getMessage('lengthMenu')}`,
      info: `${chrome.i18n.getMessage('info')}`,
      infoEmpty: `${chrome.i18n.getMessage('infoEmpty')}`,
      infoFiltered: `${chrome.i18n.getMessage('infoFiltered')}`,
      loadingRecords: `${chrome.i18n.getMessage('loadingRecords')}`,
      zeroRecords: `${chrome.i18n.getMessage('zeroRecords')}`,
      emptyTable: `${chrome.i18n.getMessage('emptyTable')}`,
      aria: {
        sortAscending: `${chrome.i18n.getMessage('sortAscending')}`,
        sortDescending: `${chrome.i18n.getMessage('sortDescending')}`,
      },
    },
    deferRender: true,
    scrollY: 375,
    scrollCollapse: true,
    scroller: true,
    responsive: {
      details: {
        renderer: function(api, rowIdx, columns) {
          var data = $.map(columns, function(col, i) {
            return col.hidden
              ? '<tr data-dt-row="' +
                  col.rowIndex +
                  '" data-dt-column="' +
                  col.columnIndex +
                  '">' +
                  '<td>' +
                  col.title +
                  ':' +
                  '</td> ' +
                  '<td>' +
                  col.data +
                  '</td>' +
                  '</tr>'
              : '';
          }).join('');

          return data ? $('<table/>').append(data) : false;
        },
      },
    },
  });

  // Fixed header
  new $.fn.dataTable.FixedHeader(datatable);

  // Neutralise accents
  $('#activityDataTable_filter label input').on('focus', function() {
    this.setAttribute('id', 'datatableSearchInput');

    // Remove accented character from search input as well
    $('#datatableSearchInput').keyup(function() {
      datatable
        .search(jQuery.fn.DataTable.ext.type.search.string(this.value))
        .draw();
    });
  });
}

/**
 * Render datatable title column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderTitleColumn(title, type, row, meta) {
  return `<div class="ns-title-column">${title}</div>`;
}

/**
 * Render datatable date column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderDateColumn(date, type, row, meta) {
  return `<div class="ns-date-column" title="${formatDate4Title(
    date,
    true
  )}">${formatFullDate(date)}</div>`;
}

/**
 * Render datatable duration column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderDurationColumn(duration, type, row, meta) {
  return `<div class="ns-duration-column">${duration}</div>`;
}

/**
 * Render datatable type column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderTypeColumn(titleType, type, row, meta) {
  return `<div class="ns-type-column">${titleType}</div>`;
}

/**
 * Shows loader while data is being retrieved
 */
function showLoader() {
  // Loader
  let container = document.createElement('div');
  container.id = 'nf-loader-container';

  let loader = document.createElement('div');
  loader.className = 'nf-loader';

  let paragraph = document.createElement('p');
  paragraph.className = 'nf-loading-message';
  let message = document.createTextNode(
    `${chrome.i18n.getMessage('loadingMessage')}`
  );
  paragraph.appendChild(message);

  container.appendChild(loader);
  container.appendChild(paragraph);

  // Get Netflix activity table
  let activityTable = document.querySelector('.retable');

  // Show loader
  activityTable.replaceWith(container);
}

/**
 * Hide loader replacing it with stats template
 * @param {*} statsTemplate
 */
function hideLoader(statsTemplate) {
  // Hide loader
  let statsSection = document.createElement('div');
  statsSection.id = 'stats-section';
  statsSection.classList.add('structural', 'stdHeight');
  statsSection.innerHTML = DOMPurify.sanitize(statsTemplate);
  document.querySelector('#nf-loader-container').replaceWith(statsSection);
}

/**
 * Translate texts in page
 */
function translatePage() {
  document.querySelector(
    '#viewedItemsCount .ns-title'
  ).textContent = chrome.i18n.getMessage('viewedItemsCount');
  document
    .querySelector('#viewedItemsCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('viewedItemsCount'));

  document.querySelector(
    '#totalTime .ns-title'
  ).textContent = chrome.i18n.getMessage('totalTime');
  document
    .querySelector('#totalTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('totalTime'));

  document.querySelector(
    '#maxTimeInDate .ns-title'
  ).textContent = chrome.i18n.getMessage('maxTimeInDate');
  document
    .querySelector('#maxTimeInDate .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('maxTimeInDate'));

  document.querySelector(
    '#deviceCount .ns-title'
  ).textContent = chrome.i18n.getMessage('deviceCount');
  document
    .querySelector('#deviceCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('deviceCount'));

  document.querySelector(
    '#moviesCount .ns-title'
  ).textContent = chrome.i18n.getMessage('moviesCount');
  document
    .querySelector('#moviesCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesCount'));

  document.querySelector(
    '#moviesTime .ns-title'
  ).textContent = chrome.i18n.getMessage('moviesTime');
  document
    .querySelector('#moviesTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesTime'));

  document.querySelector(
    '#seriesCount .ns-title'
  ).textContent = chrome.i18n.getMessage('seriesCount');
  document
    .querySelector('#seriesCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('seriesCount'));

  document.querySelector(
    '#seriesTime .ns-title'
  ).textContent = chrome.i18n.getMessage('seriesTime');
  document
    .querySelector('#seriesTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('seriesTime'));

  document.querySelector(
    '#moviesVsTvTime .ns-title'
  ).textContent = chrome.i18n.getMessage('moviesVsTvTime');
  document
    .querySelector('#moviesVsTvTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesVsTvTime'));

  document.querySelector(
    '#meanTimeByWeekDay .ns-title'
  ).textContent = chrome.i18n.getMessage('meanTimeByWeekDay');
  document
    .querySelector('#meanTimeByWeekDay .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('meanTimeByWeekDay'));

  document.querySelector(
    '#activity .ns-title'
  ).textContent = chrome.i18n.getMessage('viewingActivity');
  document
    .querySelector('#activity .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('viewingActivity'));

  document.querySelector(
    '#activityDataTable #dataTableTitle'
  ).textContent = chrome.i18n.getMessage('title');
  document.querySelector(
    '#activityDataTable #dataTableDateFormatted'
  ).textContent = chrome.i18n.getMessage('date');
  document.querySelector(
    '#activityDataTable #dataTableDurationFormatted'
  ).textContent = chrome.i18n.getMessage('duration');
  document.querySelector(
    '#activityDataTable #dataTableType'
  ).textContent = chrome.i18n.getMessage('type');
}

/**
 * Format number adding thousands separator (comma in english and point in spanish)
 * @param {*} number
 */
function formatNumber(number) {
  if (chrome.i18n.getUILanguage() === 'es') {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

/**
 * Format Netflix date with timestamp
 * Format depends on locale
 * @param number dateMilliseconds
 */
function formatFullDate(dateMilliseconds) {
  const date = new Date(dateMilliseconds);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date
    .getFullYear()
    .toString()
    .substr(-2);
  const hours = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minutes =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const seconds =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;

  if (chrome.i18n.getUILanguage() === 'es') {
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } else {
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }
}

/**
 * Format Netflix date
 * Format depends on locale
 * @param number dateMilliseconds
 */
function formatDate(dateMilliseconds) {
  const date = new Date(dateMilliseconds);
  if (chrome.i18n.getUILanguage() === 'es') {
    return `${date.getDate()}/${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .substr(-2)}`;
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}/${date
      .getFullYear()
      .toString()
      .substr(-2)}`;
  }
}

/**
 * Format date to show it on titles
 * Format depends on locale
 * @param number dateMilliseconds
 */
function formatDate4Title(dateMilliseconds, showHours) {
  const date = new Date(dateMilliseconds);
  const dayOfWeek = chrome.i18n.getMessage(WEEK_DAYS[date.getDay()]);
  const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;
  const month = chrome.i18n.getMessage(MONTHS[date.getMonth()]);
  const year = date.getFullYear();

  if (!showHours) {
    return `${dayOfWeek}, ${day} ${month} ${year}`;
  }

  const hours = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minutes =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const seconds =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;
  return `${dayOfWeek}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Return viewing date of the passed element
 * @param {*} element
 */
function getDate(element) {
  const date = new Date(element.date);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

/**
 * Shows error page is something does not work as expected or empty page if vieweing activity is empty
 * @param {*} error
 */
function showEmptyOrErrorSection(error) {
  const template = error ? '/error.html' : '/empty.html';
  const sectionId = `${error ? 'error' : 'empty'}`;

  // Load HTML page
  fetch(chrome.extension.getURL(template))
    .then(response => response.text())
    .then(template => {
      let section = document.createElement('div');
      section.id = `${sectionId}-section`;
      section.classList.add('structural', 'stdHeight');
      section.innerHTML = DOMPurify.sanitize(template);
      section.querySelector('h1').textContent = chrome.i18n.getMessage(
        'myViewingStats'
      );
      section.querySelector('h2').textContent = chrome.i18n.getMessage(
        `${error ? 'errorMessage' : 'emptyViewingActivity'}`
      );
      section.querySelector('h3').textContent = chrome.i18n.getMessage(
        `${error ? 'createIssueMessage' : 'goWatchSomething'}`
      );
      document
        .querySelector('.responsive-account-container div')
        .replaceWith(section);
    })
    .catch(error => {
      console.error(
        `Error loading ${sectionId} page, this is embarrasing...`,
        error
      );
    });
}
