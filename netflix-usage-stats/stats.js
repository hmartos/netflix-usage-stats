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
  othersCount: 0
}
const WEEK_DAYS = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

let BUILD_IDENTIFIER;

// MAIN
document.documentElement.style.visibility = 'hidden';
document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.style.visibility = '';
    main();
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
      getActivity().then(viewedItems => {
        hideLoader(statsTemplate);

        translatePage();

        calculateStats(viewedItems);
        
        showStats();
      })
      .catch(error => console.error(error));
    })
    .catch(error => console.error(error));
}

/**
 * Clear activity page to be used as the skeleton for stats page
 */
function setupStatsPage() { 
  BUILD_IDENTIFIER = getNetflixBuildId();
  console.log(`Netflix BUILD_IDENTIFIER: ${BUILD_IDENTIFIER}`);

  // Change page title
  document.querySelector('h1').innerHTML = chrome.i18n.getMessage("myViewingStats");

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
  const scripts = Array.prototype.slice.call( document.scripts );
  let buildId = null;

  scripts.forEach((script, index) => {
    const buildIdIndex = script.innerHTML.indexOf('BUILD_IDENTIFIER');
    if (buildIdIndex > -1) {
      const text = script.innerHTML.substring(buildIdIndex + 19);
      buildId = text.substring(0, text.indexOf('\"'));
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
      console.log(`Viewing history size is ${count}`)
      let pages = Math.ceil(count / PAGE_SIZE);

      console.log(`Viewing history has ${pages} pages of ${PAGE_SIZE} elements per page`)
      viewedItems = viewedItems.concat(data.viewedItems);

      const pageList = [];
      for (let pageNumber = 1; pageNumber < pages; pageNumber++) {
        pageList.push(pageNumber);
      }

      // Executes a request for each activity page
      const promises = pageList.map((page) => {
        return getActivityPage(page)
          .then(response => response.json())
          .then(data => {
            // console.log(`Results of page ${page}`, data);
            viewedItems = viewedItems.concat(data.viewedItems);
          })
          .catch(error => console.error(`Error loading activity page ${page}`, error));
      })

      // Synchronizes when all requests are resolved
      Promise.all(promises)
      .then(response => {
        // console.log(`All pages loaded, viewed items: `, viewedItems);
        resolve(viewedItems);
      })
      .catch(error => {
        console.error(`Error in executing ${error}`);
        reject();
      })
    })
    .catch(error => console.error(error));
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
  return fetch(`https://www.netflix.com/api/shakti/${buildId}/viewingactivity?pg=${page}&pgSize=${PAGE_SIZE}`, {credentials: 'same-origin'})
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
  console.log("Activity data", viewedItems);

  summary.viewedItemsCount = viewedItems.length;
  summary.firstUse = viewedItems[viewedItems.length - 1]['dateStr'];
  summary.totalTime = _.sumBy(viewedItems, 'duration');

  // Time by date
  const timeByDayGroup = _.groupBy(viewedItems, (viewedItem) => {
    const date = new Date(viewedItem.date);
    // TODO Change format depending on language
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  })

  console.log("Time by day group", timeByDayGroup);
  
  const timeByDay = _.reduce(timeByDayGroup, (result, value, key) => {
    const duration = _.sumBy(value, 'duration');
    result[key] = duration;
    return result;
  }, {});

  console.log("Time byday", timeByDay);
  
  const maxTimeInDate = _.maxBy(_.values(timeByDay))
  const maxTimeInDateDate = _.findKey(timeByDay, (timeByDay) => { return timeByDay === maxTimeInDate });
  console.log("Max time in a day " + maxTimeInDate, secondsToYdhms(maxTimeInDate));
  console.log("Date of max time in a day", maxTimeInDateDate);

  // Time by day week
  const timeByDayWeekGroup = _.groupBy(viewedItems, (viewedItem) => {
    return new Date(viewedItem.date).getDay();
  })
  
  // console.log("Time by day week", timeByDayWeekGroup);

  const timeByDayWeek = _.reduce(timeByDayWeekGroup, (result, value, key) => {
   //const duration = _.sumBy(value, 'duration');
    const timeByDate = _.reduce(_.groupBy(value, 'dateStr'), (result, value, key) => {
      result[key] = _.sumBy(value, 'duration');
      return result;
    }, {});

    result[WEEK_DAYS[key]] = _.sum(_.values(timeByDate));
    return result;
  }, {});

  console.log("Time by day week", timeByDayWeek);
      
  // Episodes
  const episodes = _.filter(viewedItems, function(item) { return _.has(item, 'series') });
  console.log("Episodes", episodes);

  // Shows
  const shows = _.groupBy(episodes, 'seriesTitle');
  console.log("Shows", shows);

  // Device Types
  const deviceTypes = _.groupBy(viewedItems, 'deviceType');
  console.log("deviceTypes", deviceTypes);

  // Movies avoiding trailers
  const movies = _.filter(viewedItems, function(item) { return !_.has(item, 'series') && item.duration > 0});
  console.log("Movies", movies);

  // Trailers and others
  const others = _.filter(viewedItems, function(item) { return !_.has(item, 'series') && item.duration === 0});
  console.log("Others", others);

  summary.maxTimeInDate = maxTimeInDate;
  summary.maxTimeInDateDate = maxTimeInDateDate;
  summary.deviceCount = Object.keys(deviceTypes).length;
  summary.moviesCount = movies.length;
  summary.moviesTime = _.sumBy(movies, 'duration');
  summary.episodesCount = episodes.length;
  summary.showsCount = Object.keys(shows).length;
  summary.showsTime = _.sumBy(episodes, 'duration');
  summary.othersCount = others.length;
  summary.timeByDayWeek = timeByDayWeek;
  
  console.log(`Time spent on Netflix: ${secondsToYdhms(summary.totalTime)}`);
  console.log(`Time spent on Movies: ${secondsToYdhms(summary.moviesTime)}`);
  console.log(`Time spent on Shows: ${secondsToYdhms(summary.showsTime)}`);
  console.log("Activity Summary", summary);
}

/**
 * Show stats in stats template
 */
function showStats() {
  // Summary
  document.querySelector('#viewedItemsCount .ns-number').innerHTML = formatNumber(summary.viewedItemsCount);
  document.querySelector('#viewedItemsCount .ns-extra-info').innerHTML = `(${chrome.i18n.getMessage('since')} ${summary.firstUse})`;
  document.querySelector('#totalTime .ns-time').innerHTML = secondsToYdhms(summary.totalTime);
  document.querySelector('#maxTimeInDate .ns-time').innerHTML = secondsToYdhms(summary.maxTimeInDate);
  document.querySelector('#maxTimeInDate .ns-extra-info').innerHTML = `(${summary.maxTimeInDateDate})`;
  document.querySelector('#deviceCount .ns-number').innerHTML = formatNumber(summary.deviceCount);

  // Movies
  document.querySelector('#moviesCount .ns-number').innerHTML = formatNumber(summary.moviesCount);
  document.querySelector('#moviesTime .ns-time').innerHTML = secondsToYdhms(summary.moviesTime);

  // Shows
  document.querySelector('#showsCount .ns-number').innerHTML = formatNumber(summary.showsCount);
  document.querySelector('#showsCount .ns-extra-info').innerHTML = `(${formatNumber(summary.episodesCount)} ${chrome.i18n.getMessage('episodes')})`;
  document.querySelector('#showsTime .ns-time').innerHTML = secondsToYdhms(summary.showsTime);

  // Charts
  createTvVsShowsTimeChart();
  createMeanTimeByWeekDayChart();
}

/**
 * Format time from seconds to years, days, hours, minutes and seconds
 * @param {*} seconds 
 */
function secondsToYdhms(seconds) {
  seconds = Number(seconds);
  const y = Math.floor(seconds / 31536000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor(seconds % 86400 / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  
  const yDisplay = y > 0 ? y + (y === 1 ? ` ${chrome.i18n.getMessage('year')}, ` : ` ${chrome.i18n.getMessage('year')}s, `) : "";
  const dDisplay = d > 0 ? d + (d === 1 ? ` ${chrome.i18n.getMessage('day')}, ` : ` ${chrome.i18n.getMessage('day')}s, `) : "";
  const hDisplay = (h > 0) || (d > 0 && h === 0) ? h + (h === 1 ? ` ${chrome.i18n.getMessage('hour')}, ` : ` ${chrome.i18n.getMessage('hour')}s, `) : "";
  const mDisplay = (m > 0) || (h > 0 && m === 0) ? m + (m === 1 ? ` ${chrome.i18n.getMessage('minute')}, ` : ` ${chrome.i18n.getMessage('minute')}s, `) : "";
  const sDisplay = s + (s === 1 ? ` ${chrome.i18n.getMessage('second')}` : ` ${chrome.i18n.getMessage('second')}s`);
  return yDisplay + dDisplay + hDisplay + mDisplay + sDisplay;
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
            chrome.i18n.getMessage('movies'), 
            chrome.i18n.getMessage('shows')
          ],
          datasets: [{
              data: [summary.moviesTime, summary.showsTime],
              backgroundColor: [
                'rgb(178, 7, 16)',
                'rgb(229, 9, 20)'
              ]
          }]
      },
      options: {
        legend: {
          display: false
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              return `${secondsToYdhms(data.datasets[0].data[tooltipItem.index])}`;
            }
          }
        }
      }
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
        chrome.i18n.getMessage('Sunday')
      ],
      datasets: [{
        label: chrome.i18n.getMessage('timeWatchingNetflix'),
        data: [
          ((summary.timeByDayWeek['Monday'] / summary.totalTime) * 100).toFixed(2),
          ((summary.timeByDayWeek['Tuesday'] / summary.totalTime) * 100).toFixed(2),
          ((summary.timeByDayWeek['Wednesday'] / summary.totalTime) * 100).toFixed(2),
          ((summary.timeByDayWeek['Thursday'] / summary.totalTime) * 100).toFixed(2),
          ((summary.timeByDayWeek['Friday'] / summary.totalTime) * 100).toFixed(2),
          ((summary.timeByDayWeek['Saturday'] / summary.totalTime) * 100).toFixed(2),
          ((summary.timeByDayWeek['Sunday'] / summary.totalTime) * 100).toFixed(2),
        ],
        backgroundColor: [
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914',
            '#e50914'
        ]
      }]
    },
    options: {
      legend: {
        display: false
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            return `${tooltipItem.value}%`;
          }
        }
      }
    }
});
}

/**
 * Shows loader while data is being retrieved
 */
function showLoader() {
  // Loader
  let container = document.createElement('div');
  container.id = 'nf-loader-container'

  let loader = document.createElement('div');
  loader.className = 'nf-loader';

  let paragraph = document.createElement('p');
  paragraph.className = 'nf-loading-message'
  let message = document.createTextNode(`${chrome.i18n.getMessage("loadingMessage")}`);
  paragraph.appendChild(message); 
  
  container.appendChild(loader);
  container.appendChild(paragraph)

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
  let statsSection = document.createElement("div");
  statsSection.id = "stats-section"
  statsSection.classList.add("structural", "stdHeight");
  statsSection.innerHTML = statsTemplate;
  document.querySelector('#nf-loader-container').replaceWith(statsSection);
}

/**
 * Translate texts in page
 */
function translatePage() {
  document.querySelector('#viewedItemsCount .ns-title').innerHTML = chrome.i18n.getMessage('viewedItemsCount');
  document.querySelector('#viewedItemsCount .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('viewedItemsCount'));

  document.querySelector('#totalTime .ns-title').innerHTML = chrome.i18n.getMessage('totalTime');
  document.querySelector('#totalTime .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('totalTime'));

  document.querySelector('#maxTimeInDate .ns-title').innerHTML = chrome.i18n.getMessage('maxTimeInDate');
  document.querySelector('#maxTimeInDate .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('maxTimeInDate'));

  document.querySelector('#deviceCount .ns-title').innerHTML = chrome.i18n.getMessage('deviceCount');
  document.querySelector('#deviceCount .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('deviceCount'));

  document.querySelector('#moviesCount .ns-title').innerHTML = chrome.i18n.getMessage('moviesCount');
  document.querySelector('#moviesCount .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('moviesCount'));

  document.querySelector('#moviesTime .ns-title').innerHTML = chrome.i18n.getMessage('moviesTime');
  document.querySelector('#moviesTime .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('moviesTime'));

  document.querySelector('#showsCount .ns-title').innerHTML = chrome.i18n.getMessage('showsCount');
  document.querySelector('#showsCount .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('showsCount'));

  document.querySelector('#showsTime .ns-title').innerHTML = chrome.i18n.getMessage('showsTime');
  document.querySelector('#showsTime .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('showsTime'));

  document.querySelector('#moviesVsTvTime .ns-title').innerHTML = chrome.i18n.getMessage('moviesVsTvTime');
  document.querySelector('#moviesVsTvTime .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('moviesVsTvTime'));

  document.querySelector('#meanTimeByWeekDay .ns-title').innerHTML = chrome.i18n.getMessage('meanTimeByWeekDay');
  document.querySelector('#meanTimeByWeekDay .ns-title-container').setAttribute('aria-label', chrome.i18n.getMessage('meanTimeByWeekDay'));
}

/**
 * Format number adding thousands separator (comma in english and point in spanish)
 * @param {*} number 
 */
function formatNumber(number) {
  if(chrome.i18n.getUILanguage() === 'es')  {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  } else {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
}