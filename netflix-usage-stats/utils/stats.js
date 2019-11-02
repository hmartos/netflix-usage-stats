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
