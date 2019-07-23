'use strict';

const PAGE_SIZE = 20;
const summary = {
  viewedItemsCount: 0,
  totalTime: 0,
  maxTimeInDate: 0,
  deviceCount: 0,
  moviesCount: 0,
  moviesTime: 0,
  showsCount: 0,
  episodesCount: 0,
  showsTime: 0,
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

let BUILD_IDENTIFIER;

// MAIN
document.documentElement.style.visibility = 'hidden';
window.addEventListener('unhandledrejection', function(promiseRejectionEvent) {
  console.error(
    `Something went wrong, sorry... but here is a trace that could help to fix the problem`,
    promiseRejectionEvent
  );
  showErrorPage();
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
    showErrorPage();
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

          calculateStats(viewedItems);

          showStats(viewedItems);
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
  console.log(`Netflix BUILD_IDENTIFIER: ${BUILD_IDENTIFIER}`);

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
        // console.log("Results of page 0", data);
        let count = data.vhSize;

        console.log(`Viewing history size is ${count}`);
        let pages = Math.ceil(count / PAGE_SIZE);

        console.log(
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
              // console.log(`Results of page ${page}`, data);
              viewedItems = viewedItems.concat(data.viewedItems);
            })
            .catch(error =>
              console.error(`Error loading activity page ${page}`, error)
            );
        });

        // Synchronizes when all requests are resolved
        Promise.all(promises)
          .then(response => {
            // console.log(`All pages loaded, viewed items: `, viewedItems);
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
  // console.log(`Getting activity page ${page}`)
  // If BUILD_IDENTIFIER couldn't be retrieved, fallback to last working BUILD_IDENTIFIER
  let buildId = BUILD_IDENTIFIER ? BUILD_IDENTIFIER : 'v8056e71b';
  return fetch(
    `https://www.netflix.com/api/shakti/${buildId}/viewingactivity?pg=${page}&pgSize=${PAGE_SIZE}`,
    { credentials: 'same-origin' }
  );
  // .then(response => response.json())
  // .then(data => {
  //   console.log(data);
  //   return data.viewedItems;
  // })
  // .catch(error => console.error(error));
}

/**
 * Calculate stats based on viewed items
 * @param {*} viewedItems
 */
function calculateStats(viewedItems) {
  console.log('Activity data', viewedItems);

  // Time by date
  const timeByDayGroup = _.groupBy(viewedItems, viewedItem => {
    const date = new Date(viewedItem.date);
    // TODO Change format depending on language
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  });

  console.log('Time by day group', timeByDayGroup);

  const timeByDay = _.reduce(
    timeByDayGroup,
    (result, value, key) => {
      const duration = _.sumBy(value, 'duration');
      result[key] = duration;
      return result;
    },
    {}
  );

  console.log('Time byday', timeByDay);

  const maxTimeInDate = _.maxBy(_.values(timeByDay));
  const maxTimeInDateDate = _.findKey(timeByDay, timeByDay => {
    return timeByDay === maxTimeInDate;
  });
  console.log(
    'Max time in a day ' + maxTimeInDate,
    secondsToYdhms(maxTimeInDate)
  );
  console.log('Date of max time in a day', maxTimeInDateDate);

  // Time by day week
  const timeByDayWeekGroup = _.groupBy(viewedItems, viewedItem => {
    return new Date(viewedItem.date).getDay();
  });

  // console.log("Time by day week", timeByDayWeekGroup);

  const timeByDayWeek = _.reduce(
    timeByDayWeekGroup,
    (result, value, key) => {
      //const duration = _.sumBy(value, 'duration');
      const timeByDate = _.reduce(
        _.groupBy(value, 'dateStr'),
        (result, value, key) => {
          result[key] = _.sumBy(value, 'duration');
          return result;
        },
        {}
      );

      result[WEEK_DAYS[key]] = _.sum(_.values(timeByDate));
      return result;
    },
    {}
  );

  console.log('Time by day week', timeByDayWeek);

  // Episodes
  const episodes = _.filter(viewedItems, function(item) {
    return _.has(item, 'series');
  });
  console.log('Episodes', episodes);

  // Shows
  const shows = _.groupBy(episodes, 'seriesTitle');
  console.log('Shows', shows);

  // Device Types
  const deviceTypes = _.groupBy(viewedItems, 'deviceType');
  console.log('deviceTypes', deviceTypes);

  // Movies
  const movies = _.filter(viewedItems, function(item) {
    return !_.has(item, 'series');
  });
  console.log('Movies', movies);

  summary.viewedItemsCount = viewedItems.length;
  summary.firstUse = viewedItems[viewedItems.length - 1]['dateStr'];
  summary.totalTime = _.sumBy(viewedItems, 'duration');
  summary.maxTimeInDate = maxTimeInDate;
  summary.maxTimeInDateDate = maxTimeInDateDate;
  summary.deviceCount = Object.keys(deviceTypes).length;
  summary.moviesCount = movies.length;
  summary.moviesTime = _.sumBy(movies, 'duration');
  summary.episodesCount = episodes.length;
  summary.showsCount = Object.keys(shows).length;
  summary.showsTime = _.sumBy(episodes, 'duration');
  summary.timeByDayWeek = timeByDayWeek;

  console.log(`Time spent on Netflix: ${secondsToYdhms(summary.totalTime)}`);
  console.log(`Time spent on Movies: ${secondsToYdhms(summary.moviesTime)}`);
  console.log(`Time spent on Shows: ${secondsToYdhms(summary.showsTime)}`);
  console.log('Activity Summary', summary);
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
  ).textContent = `(${chrome.i18n.getMessage('since')} ${summary.firstUse})`;
  document.querySelector('#totalTime .ns-time').textContent = secondsToYdhms(
    summary.totalTime
  );
  document.querySelector(
    '#maxTimeInDate .ns-time'
  ).textContent = secondsToYdhms(summary.maxTimeInDate);
  document.querySelector(
    '#maxTimeInDate .ns-extra-info'
  ).textContent = `(${summary.maxTimeInDateDate})`;
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

  // Shows
  document.querySelector('#showsCount .ns-number').textContent = formatNumber(
    summary.showsCount
  );
  document.querySelector(
    '#showsCount .ns-extra-info'
  ).textContent = `(${formatNumber(
    summary.episodesCount
  )} ${chrome.i18n.getMessage('episodes')})`;
  document.querySelector('#showsTime .ns-time').textContent = secondsToYdhms(
    summary.showsTime
  );

  // Charts
  createTvVsShowsTimeChart();
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
 * Format time from seconds to minutes
 * @param {*} seconds
 */
function secondsToMinutes(seconds) {
  const durationFormatted = new Date(seconds * 1000)
    .toISOString()
    .substr(11, 8);
  if (durationFormatted === '00:00:00') {
    return 'N/A';
  } else if (durationFormatted.startsWith('00')) {
    return durationFormatted.substr(3, 5);
  } else {
    return durationFormatted;
  }
}

/**
 * Create time watching movies vs shows pie chart
 */
function createTvVsShowsTimeChart() {
  // Generates chart
  var ctx = document.getElementById('moviesVsTvTimeChart');
  var myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [
        `${chrome.i18n.getMessage('movies')}`,
        `${chrome.i18n.getMessage('shows')}`,
      ],
      datasets: [
        {
          data: [summary.moviesTime, summary.showsTime],
          backgroundColor: ['rgb(178, 7, 16)', 'rgb(229, 9, 20)'],
        },
      ],
    },
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            return `${data.labels[tooltipItem.index]}: ${secondsToYdhms(
              data.datasets[0].data[tooltipItem.index]
            )}`;
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
          label: chrome.i18n.getMessage('timeWatchingNetflix'),
          data: [
            (
              (summary.timeByDayWeek['Monday'] / summary.totalTime) *
              100
            ).toFixed(2),
            (
              (summary.timeByDayWeek['Tuesday'] / summary.totalTime) *
              100
            ).toFixed(2),
            (
              (summary.timeByDayWeek['Wednesday'] / summary.totalTime) *
              100
            ).toFixed(2),
            (
              (summary.timeByDayWeek['Thursday'] / summary.totalTime) *
              100
            ).toFixed(2),
            (
              (summary.timeByDayWeek['Friday'] / summary.totalTime) *
              100
            ).toFixed(2),
            (
              (summary.timeByDayWeek['Saturday'] / summary.totalTime) *
              100
            ).toFixed(2),
            (
              (summary.timeByDayWeek['Sunday'] / summary.totalTime) *
              100
            ).toFixed(2),
          ],
          backgroundColor: [
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
          ],
        },
      ],
    },
    options: {
      legend: {
        display: false,
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            return `${tooltipItem.value}%`;
          },
        },
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
    viewedItem.dateFormatted = formatDate(viewedItem.date);
    viewedItem.durationFormatted = secondsToMinutes(viewedItem.duration);
    viewedItem.type = viewedItem.series
      ? `${chrome.i18n.getMessage('show')}`
      : `${chrome.i18n.getMessage('movie')}`;
    return viewedItem;
  });
  console.log(`Datatable data`, dataset);

  const datatable = $('#activityDataTable').DataTable({
    data: dataset,
    columns: [
      { data: 'title' },
      { data: 'date' },
      { data: 'dateFormatted' },
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
function renderTitleColumn(data, type, row, meta) {
  return `<div class="ns-title-column">${data}</div>`;
}

/**
 * Render datatable date column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderDateColumn(data, type, row, meta) {
  return `<div class="ns-date-column">${data}</div>`;
}

/**
 * Render datatable duration column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderDurationColumn(data, type, row, meta) {
  return `<div class="ns-duration-column">${data}</div>`;
}

/**
 * Render datatable type column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderTypeColumn(data, type, row, meta) {
  return `<div class="ns-type-column">${data}</div>`;
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
  console.log(activityTable);

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
    '#showsCount .ns-title'
  ).textContent = chrome.i18n.getMessage('showsCount');
  document
    .querySelector('#showsCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('showsCount'));

  document.querySelector(
    '#showsTime .ns-title'
  ).textContent = chrome.i18n.getMessage('showsTime');
  document
    .querySelector('#showsTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('showsTime'));

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
 * Format date in dd/MM/yyyy HH:mm:ss format
 * @param {*} dateString
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;
  const month =
    date.getMonth() + 1 > 9 ? date.getMonth() + 1 : `0${date.getMonth() + 1}`;
  const year = date.getFullYear();
  const hours = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minutes =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const seconds =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Shows error page is something does not work as expected
 */
function showErrorPage() {
  // Load HTML page
  fetch(chrome.extension.getURL('/error.html'))
    .then(response => response.text())
    .then(errorTemplate => {
      let errorSection = document.createElement('div');
      errorSection.id = 'error-section';
      errorSection.classList.add('structural', 'stdHeight');
      errorSection.innerHTML = DOMPurify.sanitize(errorTemplate);
      errorSection.querySelector('h1').textContent = chrome.i18n.getMessage(
        'myViewingStats'
      );
      errorSection.querySelector('h2').textContent = chrome.i18n.getMessage(
        'errorMessage'
      );
      errorSection.querySelector('h3').textContent = chrome.i18n.getMessage(
        'createIssueMessage'
      );
      document
        .querySelector('.responsive-account-container div')
        .replaceWith(errorSection);
    })
    .catch(error => {
      console.log('Error loading error page, this is embarrasing...', error);
    });
}
