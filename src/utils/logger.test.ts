/**
 * ロガーユーティリティのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logDebug, logInfo, logWarn, logError, LogLevel } from './logger';

describe('Logger', () => {
  // コンソールメソッドをスパイにする
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should log debug messages with correct format', () => {
    logDebug('Test debug message');
    
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[DEBUG\] \[kintone-app-version-controller\] Test debug message$/),
    );
  });
  
  it('should log info messages with correct format', () => {
    logInfo('Test info message');
    
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\] \[kintone-app-version-controller\] Test info message$/),
    );
  });
  
  it('should log warn messages with correct format', () => {
    logWarn('Test warn message');
    
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[WARN\] \[kintone-app-version-controller\] Test warn message$/),
    );
  });
  
  it('should log error messages with correct format', () => {
    logError('Test error message');
    
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\] \[kintone-app-version-controller\] Test error message$/),
    );
  });
  
  it('should include additional parameters', () => {
    const additionalParam = { key: 'value' };
    logError('Test error message with params', additionalParam);
    
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\] \[kintone-app-version-controller\] Test error message with params$/),
      additionalParam
    );
  });
  
  it('should log multiple levels correctly', () => {
    logDebug('Debug message');
    logInfo('Info message');
    logWarn('Warn message');
    logError('Error message');
    
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
