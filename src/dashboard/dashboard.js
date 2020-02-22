'use strict';
const DEBUG_MODE = false;
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
    console.error(`Something went wrong, sorry... but here is a trace that could help to fix the problem`, error);
    showEmptyOrErrorSection(error);
  }
});

// FUNCTIONS
function main() {
  const BUILD_IDENTIFIER = getNetflixBuildId();
  // If BUILD_IDENTIFIER couldn't be retrieved, fallback to last working BUILD_IDENTIFIER
  const buildId = BUILD_IDENTIFIER ? BUILD_IDENTIFIER : 'v04e0c12d';
  debug(`Netflix BUILD_IDENTIFIER: ${buildId}`);

  setupDashboardTemplate();

  showLoader();

  // Load dashboard HTML template
  fetch(chrome.extension.getURL('/dashboard/dashboard.html'))
    .then(response => response.text())
    .then(statsTemplate => {
      // Get viewing activity
      getActivity(buildId)
        .then(viewedItems => {
          hideLoader(statsTemplate);

          fillDashboardTemplate(viewedItems);

          if (_.isEmpty(viewedItems)) {
            showEmptyOrErrorSection();
          } else {
            calculateStats(viewedItems);
            calculateAchievements(viewedItems);

            createTvVsSeriesTimeChart();
            createMeanTimeByWeekDayChart();

            showStats();

            createViewingActivityList(viewedItems);
          }
        })
        .catch(error => {
          console.error('Error loading viewing activity and calculating stats', error);
          throw error;
        });
    })
    .catch(error => {
      console.error('Error loading dashboard.html template', error);
      throw error;
    });
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
      section.querySelector('h1').textContent = chrome.i18n.getMessage('myViewingStats');
      section.querySelector('h2').textContent = chrome.i18n.getMessage(
        `${error ? 'errorMessage' : 'emptyViewingActivity'}`
      );
      section.querySelector('h3').textContent = chrome.i18n.getMessage(
        `${error ? 'createIssueMessage' : 'goWatchSomething'}`
      );
      document.querySelector('.responsive-account-container div').replaceWith(section);
    })
    .catch(error => {
      console.error(`Error loading ${sectionId} page, this is embarrasing...`, error);
    });
}
