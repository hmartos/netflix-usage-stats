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

let language = 'en';


// MAIN
main();


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

        initializeLanguage(language);

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
  // TODO Change language REMOVE!!!!!
  // document.querySelector('html').setAttribute('lang', 'en')

  // Get page language
  language = document.querySelector('html').getAttribute('lang') || 'en';
  
  // Change page title
  document.querySelector('h1').innerHTML = language === 'es' ? 'Mis estadísticas' : 'My stats';

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
      // TODO WARNING!!!!!!! UNCOMMENT LINE UP AND REMOVE LINE DOWN
      //let pages = 5;
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
  return fetch(`https://www.netflix.com/api/shakti/v0a906ca6/viewingactivity?pg=${page}&pgSize=${PAGE_SIZE}`, {credentials: 'same-origin'})
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
  console.log("Max time in a day " + maxTimeInDate, secondsToDhms(maxTimeInDate));
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

  summary.viewedItemsCount = viewedItems.length;
  summary.totalTime = _.sumBy(viewedItems, 'duration');
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
  
  console.log(`Time spent on Netflix: ${secondsToDhms(summary.totalTime)}`);
  console.log(`Time spent on Movies: ${secondsToDhms(summary.moviesTime)}`);
  console.log(`Time spent on Shows: ${secondsToDhms(summary.showsTime)}`);
  console.log("Activity Summary", summary);
}

/**
 * Show stats in stats template
 */
function showStats() {
  // Summary
  document.querySelector('#viewedItemsCount .ns-number').innerHTML = formatNumber(summary.viewedItemsCount);
  document.querySelector('#totalTime .ns-time').innerHTML = secondsToDhms(summary.totalTime);
  document.querySelector('#maxTimeInDate .ns-time').innerHTML = secondsToDhms(summary.maxTimeInDate);
  document.querySelector('#maxTimeInDate .ns-extra-info').innerHTML = `(${summary.maxTimeInDateDate})`;
  document.querySelector('#deviceCount .ns-number').innerHTML = formatNumber(summary.deviceCount);

  // Movies
  document.querySelector('#moviesCount .ns-number').innerHTML = formatNumber(summary.moviesCount);
  document.querySelector('#moviesTime .ns-time').innerHTML = secondsToDhms(summary.moviesTime);

  // Shows
  document.querySelector('#showsCount .ns-number').innerHTML = formatNumber(summary.showsCount);
  document.querySelector('#showsCount .ns-extra-info').innerHTML = `(${formatNumber(summary.episodesCount)} ${i18next.t('episodes')})`;
  document.querySelector('#showsTime .ns-time').innerHTML = secondsToDhms(summary.showsTime);

  // Charts
  createTvVsShowsTimeChart();
  createMeanTimeByWeekDayChart();
}

/**
 * Format time from seconds to years, days, hours, minutes and seconds
 * @param {*} seconds 
 */
function secondsToDhms(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  
  var dDisplay = d > 0 ? d + (d === 1 ? ` ${i18next.t('day')}, ` : ` ${i18next.t('day')}s, `) : "";
  var hDisplay = (h > 0) || (d > 0 && h === 0) ? h + (h === 1 ? ` ${i18next.t('hour')}, ` : ` ${i18next.t('hour')}s, `) : "";
  var mDisplay = (m > 0) || (h > 0 && m === 0) ? m + (m === 1 ? ` ${i18next.t('minute')}, ` : ` ${i18next.t('minute')}s, `) : "";
  var sDisplay = s + (s === 1 ? ` ${i18next.t('second')}` : ` ${i18next.t('second')}s`);
  return dDisplay + hDisplay + mDisplay + sDisplay;
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
            i18next.t('movies'), 
            i18next.t('shows')
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
              return `${secondsToDhms(data.datasets[0].data[tooltipItem.index])}`;
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
        i18next.t('Monday'), 
        i18next.t('Tuesday'), 
        i18next.t('Wednesday'), 
        i18next.t('Thursday'), 
        i18next.t('Friday'), 
        i18next.t('Saturday'), 
        i18next.t('Sunday')
      ],
      datasets: [{
        label: i18next.t('timeWatchingNetflix'),
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
  let loader = document.createElement('div');
  loader.className = 'nfLoader';

  // Get Netflix activity table
  let activityTable = document.querySelector('.retable');
  console.log(activityTable);

  // Show loader
  activityTable.replaceWith(loader);
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
  document.querySelector('.nfLoader').replaceWith(statsSection);
}

/**
 * Initialize i18n with given language
 * @param {*} language 
 */
function initializeLanguage(language) {
  i18next.init({
    lng: language,
    debug: true,
    resources: {
      en: {
        translation: {
          "myStats": "My stats",
          "viewedItemsCount": "Elements watched",
          "totalTime": "Total time on Netflix",
          "maxTimeInDate": "Netflix marathon (in a day)",
          "deviceCount": "Used devices",
          "moviesCount": "Movies watched",
          "moviesTime": "Total time watching movies",
          "showsCount": "Shows watched",
          "showsTime": "Total time watching shows",
          "moviesVsTvTime": "Time watching movies/shows",
          "meanTimeByWeekDay": "Percentage of time on Netflix by day of week",
          "episodes": "Episodes",
          "movies": "Movies",
          "shows": "Shows",
          "timeWatchingNetflix": "Time watching Netflix",
          "Monday": "Monday",
          "Tuesday": "Tuesday",
          "Wednesday": "Wednesday",
          "Thursday": "Thursday",
          "Friday": "Friday",
          "Saturday": "Saturday",
          "Sunday": "Sunday",
          "year": "year",
          "day": "day",
          "hour": "hour",
          "minute": "minute",
          "second": "second",
        }
      },
      es: {
        translation: {
          "myStats": "Mis estadísticas",
          "viewedItemsCount": "Elementos reproducidos",
          "totalTime": "Tiempo total en Netflix",
          "maxTimeInDate": "Maratón de Netflix (en un día)",
          "deviceCount": "Dispositivos utilizados",
          "moviesCount": "Películas vistas",
          "moviesTime": "Tiempo total viendo películas",
          "showsCount": "Series vistas",
          "showsTime": "Tiempo total viendo series",
          "moviesVsTvTime": "Tiempo viendo películas/series",
          "meanTimeByWeekDay": "Porcentaje de tiempo en Netflix por día de la semana",
          "episodes": "Capítulos",
          "movies": "Películas",
          "shows": "Series",
          "timeWatchingNetflix": "Tiempo viendo Netflix",
          "Monday": "Lunes",
          "Tuesday": "Martes",
          "Wednesday": "Miércoles",
          "Thursday": "Jueves",
          "Friday": "Viernes",
          "Saturday": "Sábado",
          "Sunday": "Domingo",
          "year": "año",
          "day": "día",
          "hour": "hora",
          "minute": "minuto",
          "second": "segundo",
        }
      }
    }
  }, function(error, t) {
    if (error) {
      console.error(error);
    }
    translatePage();
  });
}

/**
 * Translate texts in page
 */
function translatePage() {
  document.querySelector('#viewedItemsCount .ns-title').innerHTML = i18next.t('viewedItemsCount');
  document.querySelector('#viewedItemsCount .ns-title-container').setAttribute('aria-label', i18next.t('viewedItemsCount'));

  document.querySelector('#totalTime .ns-title').innerHTML = i18next.t('totalTime');
  document.querySelector('#totalTime .ns-title-container').setAttribute('aria-label', i18next.t('totalTime'));

  document.querySelector('#maxTimeInDate .ns-title').innerHTML = i18next.t('maxTimeInDate');
  document.querySelector('#maxTimeInDate .ns-title-container').setAttribute('aria-label', i18next.t('maxTimeInDate'));

  document.querySelector('#deviceCount .ns-title').innerHTML = i18next.t('deviceCount');
  document.querySelector('#deviceCount .ns-title-container').setAttribute('aria-label', i18next.t('deviceCount'));

  document.querySelector('#moviesCount .ns-title').innerHTML = i18next.t('moviesCount');
  document.querySelector('#moviesCount .ns-title-container').setAttribute('aria-label', i18next.t('moviesCount'));

  document.querySelector('#moviesTime .ns-title').innerHTML = i18next.t('moviesTime');
  document.querySelector('#moviesTime .ns-title-container').setAttribute('aria-label', i18next.t('moviesTime'));

  document.querySelector('#showsCount .ns-title').innerHTML = i18next.t('showsCount');
  document.querySelector('#showsCount .ns-title-container').setAttribute('aria-label', i18next.t('showsCount'));

  document.querySelector('#showsTime .ns-title').innerHTML = i18next.t('showsTime');
  document.querySelector('#showsTime .ns-title-container').setAttribute('aria-label', i18next.t('showsTime'));

  document.querySelector('#moviesVsTvTime .ns-title').innerHTML = i18next.t('moviesVsTvTime');
  document.querySelector('#moviesVsTvTime .ns-title-container').setAttribute('aria-label', i18next.t('moviesVsTvTime'));

  document.querySelector('#meanTimeByWeekDay .ns-title').innerHTML = i18next.t('meanTimeByWeekDay');
  document.querySelector('#meanTimeByWeekDay .ns-title-container').setAttribute('aria-label', i18next.t('meanTimeByWeekDay'));
}

/**
 * Format number adding thousands separator (comma in english and point in spanish)
 * @param {*} number 
 */
function formatNumber(number) {
  if(language === 'es')  {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  } else {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
}