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
 * Get Netflix Build ID
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
