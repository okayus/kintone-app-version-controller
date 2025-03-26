/**
 * ヘルパー関数のテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deepClone,
  sleep,
  normalizeRecord,
  toKintoneRecord,
  truncateString,
  generateVersionNumber,
  generateSemVerNumber,
  getCurrentTimestamp,
  generateJsonDiff,
  generateDetailedJsonDiff,
  generateTextDiff
} from './helpers';

describe('deepClone', () => {
  it('オブジェクトの深いクローンを作成できること', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });
});

describe('normalizeRecord', () => {
  it('kintoneレコードを正規化できること', () => {
    const record = {
      field1: { value: 'value1' },
      field2: { value: 123 },
      field3: { value: [{ value: 'inner' }] }
    };
    
    const normalized = normalizeRecord(record);
    
    expect(normalized).toEqual({
      field1: 'value1',
      field2: 123,
      field3: [{ value: 'inner' }]
    });
  });
});

describe('toKintoneRecord', () => {
  it('オブジェクトをkintoneレコード形式に変換できること', () => {
    const obj = {
      field1: 'value1',
      field2: 123
    };
    
    const record = toKintoneRecord(obj);
    
    expect(record).toEqual({
      field1: { value: 'value1' },
      field2: { value: 123 }
    });
  });
});

describe('truncateString', () => {
  it('文字列を指定された長さに省略できること', () => {
    expect(truncateString('abcdefghij', 5)).toBe('ab...');
    expect(truncateString('abcde', 5)).toBe('abcde');
    expect(truncateString('abc', 5)).toBe('abc');
  });
  
  it('サフィックスをカスタマイズできること', () => {
    expect(truncateString('abcdefghij', 5, '...')).toBe('ab...');
    expect(truncateString('abcdefghij', 5, '→')).toBe('abcd→');
  });
});

describe('generateVersionNumber', () => {
  it('バージョン番号をインクリメントできること', () => {
    expect(generateVersionNumber('1')).toBe('2');
    expect(generateVersionNumber('42')).toBe('43');
  });
  
  it('無効な入力の場合はデフォルト値を返すこと', () => {
    expect(generateVersionNumber()).toBe('1');
    expect(generateVersionNumber('abc')).toBe('1');
  });
});

describe('generateSemVerNumber', () => {
  it('メジャーバージョンをインクリメントできること', () => {
    expect(generateSemVerNumber('1.2.3', 'major')).toBe('2.0.0');
  });
  
  it('マイナーバージョンをインクリメントできること', () => {
    expect(generateSemVerNumber('1.2.3', 'minor')).toBe('1.3.0');
  });
  
  it('パッチバージョンをインクリメントできること', () => {
    expect(generateSemVerNumber('1.2.3', 'patch')).toBe('1.2.4');
    expect(generateSemVerNumber('1.2.3')).toBe('1.2.4'); // デフォルトはパッチ
  });
  
  it('無効な入力の場合はデフォルト値を返すこと', () => {
    expect(generateSemVerNumber()).toBe('0.1.0');
    expect(generateSemVerNumber('invalid')).toBe('0.1.0');
  });
});

describe('getCurrentTimestamp', () => {
  it('ISO形式のタイムスタンプを返すこと', () => {
    const timestamp = getCurrentTimestamp();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });
});

describe('generateJsonDiff', () => {
  it('2つのオブジェクトが同じ場合は空配列を返すこと', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    
    const diffs = generateJsonDiff(obj1, obj2);
    expect(diffs).toEqual([]);
  });
  
  it('2つのオブジェクトが異なる場合は差分を返すこと', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 3 } };
    
    const diffs = generateJsonDiff(obj1, obj2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].changeType).toBe('modified');
    expect(diffs[0].oldValue).toEqual(obj1);
    expect(diffs[0].newValue).toEqual(obj2);
  });
});

describe('generateDetailedJsonDiff', () => {
  it('プリミティブ値の変更を検出できること', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('a');
    expect(diffs[0].oldValue).toBe(1);
    expect(diffs[0].newValue).toBe(2);
    expect(diffs[0].changeType).toBe('modified');
  });
  
  it('ネストされたオブジェクトの変更を検出できること', () => {
    const obj1 = { a: { b: { c: 1 } } };
    const obj2 = { a: { b: { c: 2 } } };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('a.b.c');
    expect(diffs[0].oldValue).toBe(1);
    expect(diffs[0].newValue).toBe(2);
  });
  
  it('追加されたプロパティを検出できること', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1, b: 2 };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('b');
    expect(diffs[0].oldValue).toBeUndefined();
    expect(diffs[0].newValue).toBe(2);
    expect(diffs[0].changeType).toBe('added');
  });
  
  it('削除されたプロパティを検出できること', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('b');
    expect(diffs[0].oldValue).toBe(2);
    expect(diffs[0].newValue).toBeUndefined();
    expect(diffs[0].changeType).toBe('removed');
  });
  
  it('配列の違いを検出できること', () => {
    const obj1 = { arr: [1, 2, 3] };
    const obj2 = { arr: [1, 2, 4] };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('arr');
    expect(diffs[0].oldValue).toEqual([1, 2, 3]);
    expect(diffs[0].newValue).toEqual([1, 2, 4]);
  });
});

describe('generateTextDiff', () => {
  it('2つの文字列の差分を生成できること', () => {
    const oldText = 'line 1\nline 2\nline 3\n';
    const newText = 'line 1\nmodified line\nline 3\n';
    
    const diff = generateTextDiff(oldText, newText);
    
    expect(diff).toContain('line 2');
    expect(diff).toContain('modified line');
    expect(diff).toContain('-');
    expect(diff).toContain('+');
  });
  
  it('コンテキスト行数を指定できること', () => {
    const oldText = 'line 1\nline 2\nline 3\nline 4\nline 5\n';
    const newText = 'line 1\nline 2\nmodified line\nline 4\nline 5\n';
    
    // コンテキスト1行
    const diff1 = generateTextDiff(oldText, newText, 1);
    const lines1 = diff1.split('\n');
    
    // コンテキスト3行（デフォルト）
    const diff3 = generateTextDiff(oldText, newText);
    const lines3 = diff3.split('\n');
    
    // コンテキスト1行の方が行数が少ないはず
    expect(lines1.length).toBeLessThan(lines3.length);
  });
});

describe('sleep', () => {
  it('指定ミリ秒待機すること', async () => {
    const startTime = Date.now();
    await sleep(10);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(10);
  });
});
