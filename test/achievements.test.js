const rewire = require('rewire');
const _ = require('lodash');
const achievementsModule = rewire('../src/utils/achievements');
const monthDiff = achievementsModule.__get__('monthDiff');
const initializeAchievementsModel = achievementsModule.__get__('initializeAchievementsModel');
const calculateAchievements = achievementsModule.__get__('calculateAchievements');
const achievementsWon = achievementsModule.__get__('achievementsWon');
const allAchievementsWon = achievementsModule.__get__('allAchievementsWon');
const formatModule = rewire('../src/utils/format');
const sec2time = formatModule.__get__('sec2time');

describe('Achievements', () => {
  beforeAll(() => {
    achievementsModule.__set__('summary', {});
    achievementsModule.__set__('_', _);
    achievementsModule.__set__('sec2time', sec2time);
    achievementsModule.__set__('debug', (msg, data) => {
      console.log(msg, data);
    });
    achievementsModule.__set__('chrome', {
      i18n: {
        getMessage: label => {
          return label;
        },
        getUILanguage: () => {
          return 'en';
        },
      },
    });
  });

  it('should calculate the difference in months between two dates', async () => {
    expect(monthDiff(new Date('2020-01-01'), new Date('2020-02-01'))).toEqual(1);
    expect(monthDiff(new Date('2019-01-15'), new Date('2020-01-15'))).toEqual(12);
    expect(monthDiff(new Date('2018-05-21'), new Date('2020-05-01'))).toEqual(24);
  });

  it('should initialize achievements model', async () => {
    initializeAchievementsModel();

    const summary = achievementsModule.__get__('summary');
    expect(summary.achievements).toBeDefined();
    expect(_.keys(summary.achievements).length).toEqual(10);
    expect(_.keys(summary.achievements)).toEqual([
      'achievement1',
      'achievement2',
      'achievement3',
      'achievement4',
      'achievement5',
      'achievement6',
      'achievement7',
      'achievement8',
      'achievement9',
      'achievement10',
    ]);
    _.keys(summary.achievements).forEach(achievement => {
      expect(summary.achievements[achievement].title).toBeDefined();
      expect(summary.achievements[achievement].description).toBeDefined();
    });
  });

  it('should calculate achievements', async () => {
    // No achievements
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 0,
      deviceCount: 0,
      firstUse: new Date(),
      viewedItemsCount: 0,
    });
    calculateAchievements();
    let summary = achievementsModule.__get__('summary');
    _.keys(summary.achievements).forEach(achievement => {
      expect(summary.achievements[achievement].won).toEqual(false);
      expect(summary.achievements[achievement].remaining).toBeDefined();
    });

    // Achievement 1
    achievementsModule.__set__('summary', {
      moviesCount: 1,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 0,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 1,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    let expectedAchievementsWon = ['achievement1'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 2
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 1,
      episodesCount: 1,
      maxTimeInDate: 0,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 1,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement2'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 3
    achievementsModule.__set__('summary', {
      moviesCount: 1000,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 0,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 1000,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement1', 'achievement3'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 4
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 100,
      episodesCount: 100,
      maxTimeInDate: 0,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 100,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement2', 'achievement4'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 5
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 21600,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 0,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement5'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 6
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 43200,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 0,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement5', 'achievement6'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 7
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 0,
      deviceCount: 5,
      firstUse: new Date(),
      viewedItemsCount: 0,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement7'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 8
    achievementsModule.__set__('summary', {
      moviesCount: 0,
      seriesCount: 0,
      episodesCount: 0,
      maxTimeInDate: 0,
      deviceCount: 1,
      firstUse: new Date('2018-04-04'),
      viewedItemsCount: 0,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement8'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 9
    achievementsModule.__set__('summary', {
      moviesCount: 1250,
      seriesCount: 150,
      episodesCount: 3750,
      maxTimeInDate: 0,
      deviceCount: 1,
      firstUse: new Date(),
      viewedItemsCount: 5000,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    expectedAchievementsWon = ['achievement1', 'achievement2', 'achievement3', 'achievement4', 'achievement9'];
    checkExpectedAchievementsWon(summary, expectedAchievementsWon);

    // Achievement 10
    achievementsModule.__set__('summary', {
      moviesCount: 1500,
      seriesCount: 150,
      episodesCount: 4000,
      maxTimeInDate: 50000,
      deviceCount: 10,
      firstUse: new Date('2018-04-04'),
      viewedItemsCount: 5500,
    });
    calculateAchievements();
    summary = achievementsModule.__get__('summary');
    _.keys(summary.achievements).forEach(achievement => {
      expect(summary.achievements[achievement].won).toEqual(true);
      expect(summary.achievements[achievement].remaining).not.toBeDefined();
    });
  });

  it('should calculate the number of achievements won', async () => {
    achievementsModule.__set__('summary', {
      achievements: {
        achievement1: { won: false },
        achievement2: { won: false },
        achievement3: { won: false },
        achievement4: { won: false },
        achievement5: { won: false },
        achievement6: { won: false },
        achievement7: { won: false },
        achievement8: { won: false },
        achievement9: { won: false },
        achievement10: { won: false },
      },
    });
    expect(achievementsWon()).toEqual(0);

    achievementsModule.__set__('summary', {
      achievements: {
        achievement1: { won: true },
        achievement2: { won: false },
        achievement3: { won: true },
        achievement4: { won: false },
        achievement5: { won: true },
        achievement6: { won: false },
        achievement7: { won: true },
        achievement8: { won: false },
        achievement9: { won: true },
        achievement10: { won: false },
      },
    });
    expect(achievementsWon()).toEqual(5);

    achievementsModule.__set__('summary', {
      achievements: {
        achievement1: { won: true },
        achievement2: { won: true },
        achievement3: { won: true },
        achievement4: { won: true },
        achievement5: { won: true },
        achievement6: { won: true },
        achievement7: { won: true },
        achievement8: { won: true },
        achievement9: { won: true },
        achievement10: { won: true },
      },
    });
    expect(achievementsWon()).toEqual(10);
  });

  it('should calculate if all achievements are won', async () => {
    achievementsModule.__set__('summary', {
      achievements: {
        achievement1: { won: true },
        achievement2: { won: true },
        achievement3: { won: true },
        achievement4: { won: true },
        achievement5: { won: false },
        achievement6: { won: true },
        achievement7: { won: true },
        achievement8: { won: true },
        achievement9: { won: true },
      },
    });
    expect(allAchievementsWon(10)).toEqual(false);

    achievementsModule.__set__('summary', {
      achievements: {
        achievement1: { won: true },
        achievement2: { won: true },
        achievement3: { won: true },
        achievement4: { won: true },
        achievement5: { won: true },
        achievement6: { won: true },
        achievement7: { won: true },
        achievement8: { won: true },
        achievement9: { won: true },
      },
    });
    expect(allAchievementsWon(10)).toEqual(true);
  });

  // Private functions
  function checkExpectedAchievementsWon(summary, expectedAchievementsWon) {
    console.log('Expected achievements won', expectedAchievementsWon);
    _.keys(summary.achievements).forEach(achievement => {
      if (_.indexOf(expectedAchievementsWon, achievement) !== -1) {
        expect(summary.achievements[achievement].won).toEqual(true);
        expect(summary.achievements[achievement].remaining).not.toBeDefined();
      } else {
        expect(summary.achievements[achievement].won).toEqual(false);
        expect(summary.achievements[achievement].remaining).toBeDefined();
      }
    });
  }
});
