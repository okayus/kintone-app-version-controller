/**
 * ヘルパー関数のテスト
 */
import { describe, it, expect, vi } from 'vitest';
import {
  deepClone,
  sleep,
  normalizeRecord,
  toKintoneRecord,
  truncateString,
  generateVersionNumber,
  getCurrentTimestamp,
} from './helpers';

describe('deepClone', () => {
  it('should create a deep clone of an object', () => {
    const original = { a: 1, b: { c: 2 } };
    const clone = deepClone(original);
    
    expect(clone).toEqual(original);
    
    // クローンが別オブジェクトであることを確認
    clone.b.c = 3;
    expect(original.b.c).toBe(2);
  });
});

describe('sleep', () => {
  it('should sleep for the specified time', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    
    // 少なくとも100ms経過していることを確認
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});

describe('normalizeRecord', () => {
  it('should convert kintone record to normal object', () => {
    const kintoneRecord = {
      field1: { value: 'value1' },
      field2: { value: 123 },
      field3: { value: ['a', 'b', 'c'] },
    };
    
    const normalized = normalizeRecord(kintoneRecord);
    
    expect(normalized).toEqual({
      field1: 'value1',
      field2: 123,
      field3: ['a', 'b', 'c'],
    });
  });
});

describe('toKintoneRecord', () => {
  it('should convert normal object to kintone record format', () => {
    const obj = {
      field1: 'value1',
      field2: 123,
      field3: ['a', 'b', 'c'],
    };
    
    const kintoneRecord = toKintoneRecord(obj);
    
    expect(kintoneRecord).toEqual({
      field1: { value: 'value1' },
      field2: { value: 123 },
      field3: { value: ['a', 'b', 'c'] },
    });
  });
});

describe('truncateString', () => {
  it('should truncate string if longer than specified length', () => {
    const str = 'This is a long string to test truncation';
    const truncated = truncateString(str, 10);
    
    expect(truncated).toBe('This is...');
    expect(truncated.length).toBe(10);
  });
  
  it('should not truncate string if shorter than specified length', () => {
    const str = 'Short str';
    const truncated = truncateString(str, 10);
    
    expect(truncated).toBe('Short str');
  });
  
  it('should allow custom suffix', () => {
    const str = 'This is a long string';
    const truncated = truncateString(str, 10, '---');
    
    expect(truncated).toBe('This is---');
  });
});

describe('generateVersionNumber', () => {
  it('should increment patch version by default', () => {
    expect(generateVersionNumber('1.2.3')).toBe('1.2.4');
  });
  
  it('should increment minor version', () => {
    expect(generateVersionNumber('1.2.3', 'minor')).toBe('1.3.0');
  });
  
  it('should increment major version', () => {
    expect(generateVersionNumber('1.2.3', 'major')).toBe('2.0.0');
  });
  
  it('should use default version if none provided', () => {
    expect(generateVersionNumber()).toBe('0.0.1');
  });
});

describe('getCurrentTimestamp', () => {
  it('should return ISO timestamp string', () => {
    const mockDate = new Date('2023-04-01T12:00:00.000Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    expect(getCurrentTimestamp()).toBe('2023-04-01T12:00:00.000Z');
    
    vi.restoreAllMocks();
  });
});
