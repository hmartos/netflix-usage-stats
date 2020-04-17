const rewire = require('rewire');
const _ = require('lodash');
const viewingModule = rewire('../src/utils/viewing');
const filterViewingActivity = viewingModule.__get__('filterViewingActivity');
const setSorting = viewingModule.__get__('setSorting');
const sortViewingActivity = viewingModule.__get__('sortViewingActivity');

describe('Viewing Activity', () => {
  beforeAll(() => {
    viewingModule.__set__('_', _);
    viewingModule.__set__('debug', (msg, data) => {
      // console.log(msg, data);
    });
  });

  it('should filter viewing activity', async () => {
    const viewingActivity = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'B title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    viewingModule.__set__('viewingActivityCopy', viewingActivity);

    filterViewingActivity('A title');
    let expected = [{ date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' }];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    filterViewingActivity('B');
    expected = [
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'B title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    filterViewingActivity('TíTlë');
    expected = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'B title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    filterViewingActivity('c');
    expected = [{ date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' }];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    filterViewingActivity('');
    expected = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'B title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    filterViewingActivity();
    expected = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'B title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);
  });

  it('should set the sorting model for viewing activity', async () => {
    viewingModule.__set__('clearSortingIcon', () => {
      // console.log('Calling clearSortingIcon function');
    });
    viewingModule.__set__('setSortingIcon', column => {
      // console.log(`Calling setSortingIcon function with column: ${column}`);
    });

    viewingModule.__set__('sortBy', { date: false });

    setSorting('date');
    expect(viewingModule.__get__('sortBy')).toEqual({ date: true });

    setSorting('date');
    expect(viewingModule.__get__('sortBy')).toEqual({ date: false });

    setSorting('title');
    expect(viewingModule.__get__('sortBy')).toEqual({ title: true });

    setSorting('title');
    expect(viewingModule.__get__('sortBy')).toEqual({ title: false });

    setSorting('duration');
    expect(viewingModule.__get__('sortBy')).toEqual({ duration: true });

    setSorting('duration');
    expect(viewingModule.__get__('sortBy')).toEqual({ duration: false });

    setSorting('type');
    expect(viewingModule.__get__('sortBy')).toEqual({ type: true });

    setSorting('type');
    expect(viewingModule.__get__('sortBy')).toEqual({ type: false });
  });

  it('should sort viewing activity', async () => {
    const viewingActivity = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    viewingModule.__set__('_viewingActivity', viewingActivity);

    sortViewingActivity('date', true);
    expect(viewingModule.__get__('_viewingActivity')).toEqual(viewingActivity);

    sortViewingActivity('date', false);
    let expected = [
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    sortViewingActivity('showTitle', true);
    expected = [
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    sortViewingActivity('showTitle', false);
    expected = [
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    sortViewingActivity('duration', true);
    expected = [
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    sortViewingActivity('duration', false);
    expected = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    sortViewingActivity('type', true);
    expected = [
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);

    sortViewingActivity('type', false);
    expected = [
      { date: new Date(2019, 2, 2, 0, 0, 0, 0), showTitle: 'A title', duration: 25, type: 'serie' },
      { date: new Date(2019, 3, 3, 0, 0, 0, 0), showTitle: 'D title', duration: 30, type: 'serie' },
      { date: new Date(2019, 4, 4, 0, 0, 0, 0), showTitle: 'B title', duration: 20, type: 'movie' },
      { date: new Date(2019, 1, 1, 0, 0, 0, 0), showTitle: 'C title', duration: 35, type: 'movie' },
    ];
    expect(viewingModule.__get__('_viewingActivity')).toEqual(expected);
  });
});
