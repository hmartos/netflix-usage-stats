const rewire = require('rewire');
const debugModule = rewire('../src/utils/debug');
const debug = debugModule.__get__('debug');

describe('Debug logging', () => {
  it('should not log a debug trace to console if DEBUG_MODE = false', async () => {
    const consoleSpy = jest.spyOn(debugModule.__get__('console'), 'log');

    debugModule.__set__('DEBUG_MODE', false);
    debug('TEST_MESSAGE');

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should log a debug trace to console if DEBUG_MODE = true', async () => {
    const consoleSpy = jest.spyOn(debugModule.__get__('console'), 'log');

    debugModule.__set__('DEBUG_MODE', true);
    debug('TEST_MESSAGE');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('TEST_MESSAGE');

    debug('TEST_MESSAGE', { hello: 'world' });
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith('TEST_MESSAGE', { hello: 'world' });
  });
});
