const rewire = require('rewire');
const _ = require('lodash');
const statsModule = rewire('../src/utils/stats');
const calculateStats = statsModule.__get__('calculateStats');
const formatModule = rewire('../src/utils/format');
const secondsToYdhms = formatModule.__get__('secondsToYdhms');

describe('Stats', () => {
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

  beforeAll(() => {
    statsModule.__set__('summary', {});
    statsModule.__set__('_', _);
    statsModule.__set__('debug', (msg, data) => {
      console.log(msg, data);
    });
    statsModule.__set__('secondsToYdhms', secondsToYdhms);
    formatModule.__set__('chrome', {
      i18n: {
        getMessage: label => {
          return label;
        },
        getUILanguage: () => {
          return 'en';
        },
      },
    });

    formatModule.__set__('WEEK_DAYS', WEEK_DAYS);
    formatModule.__set__('MONTHS', MONTHS);
  });

  it('should calculate stats based on viewed items', async () => {
    const viewedItems = [
      {
        duration: 1353,
        date: 1459541084838,
        deviceType: 0,
        series: 70155610,
        seriesTitle: "That '70s Show",
      },
      {
        duration: 1352,
        date: 1459537113981,
        deviceType: 1,
        series: 70155610,
        seriesTitle: "That '70s Show",
      },
      {
        duration: 1351,
        date: 1459535886839,
        deviceType: 2,
        series: 70155610,
        seriesTitle: "That '70s Show",
      },
      {
        duration: 1353,
        date: 1459522597462,
        deviceType: 0,
        series: 70155610,
        seriesTitle: "That '70s Show",
      },
      {
        duration: 1354,
        date: 1459521236656,
        deviceType: 0,
        series: 70155610,
        seriesTitle: "That '70s Show",
      },
      {
        duration: 1261,
        date: 1459287790985,
        deviceType: 0,
        series: 70143830,
        seriesTitle: 'The Big Bang Theory',
      },
      {
        duration: 1352,
        date: 1459202685927,
        deviceType: 0,
        series: 70155610,
        seriesTitle: "That '70s Show",
      },
      {
        duration: 6420,
        date: 1459031560228,
        deviceType: 0,
      },
      {
        duration: 6420,
        date: 1459031560228,
        deviceType: 0,
      },
      {
        duration: 6420,
        date: 1459031560228,
        deviceType: 0,
      },
    ];
    const stats = calculateStats(viewedItems);

    // With Spanish timezone
    const expected = {
      viewedItemsCount: 10,
      totalTime: 28636,
      firstUse: new Date('2016-03-26T22:32:40.228Z'),
      deviceCount: 3,
      maxTimeInDate: 19260,
      maxTimeInDateDate: 'Sat Mar 26 2016 00:00:00 GMT+0100 (Central European Standard Time)',
      moviesCount: 3,
      moviesTime: 19260,
      seriesCount: 2,
      episodesCount: 7,
      seriesTime: 9376,
      meanTimeByDayWeek: {
        Tuesday: '2613',
        Friday: '6763',
        Saturday: '19260',
      },
    };

    expect(stats).toEqual(expected);
  });
});
