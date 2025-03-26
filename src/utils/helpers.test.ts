/**
 * ヘルパー関数のテスト
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  deepClone,
  normalizeRecord,
  toKintoneRecord,
  truncateString,
  generateVersionNumber,
  generateSemVerNumber,
  getCurrentTimestamp,
  generateJsonDiff,
  generateDetailedJsonDiff,
  generateTextDiff,
  sleep
} from './helpers';

// diffモジュールをモック
vi.mock('diff', () => {
  return {
    createPatch: vi.fn().mockReturnValue('mock diff output')
  };
});

describe('deepClone', () => {
  it('オブジェクトの深いコピーを作成できること', () => {
    const obj = { a: 1, b: { c: 2 } };
    const clone = deepClone(obj);
    
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.b).not.toBe(obj.b);
  });
});

describe('normalizeRecord', () => {
  it('kintoneレコードを正規化できること', () => {
    const record = {
      field1: { value: 'value1' },
      field2: { value: 123 },
    };
    
    const normalized = normalizeRecord(record);
    
    expect(normalized).toEqual({
      field1: 'value1',
      field2: 123,
    });
  });
});

describe('toKintoneRecord', () => {
  it('通常のオブジェクトをkintoneレコード形式に変換できること', () => {
    const obj = {
      field1: 'value1',
      field2: 123,
    };
    
    const record = toKintoneRecord(obj);
    
    expect(record).toEqual({
      field1: { value: 'value1' },
      field2: { value: 123 },
    });
  });
});

describe('truncateString', () => {
  it('文字列が最大長を超えない場合は元の文字列を返すこと', () => {
    const str = 'hello';
    expect(truncateString(str, 10)).toBe(str);
  });
  
  it('文字列が最大長を超える場合は省略すること', () => {
    const str = 'hello world';
    expect(truncateString(str, 8)).toBe('hello...');
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
  });
  
  it('無効な入力の場合はデフォルト値を返すこと', () => {
    expect(generateSemVerNumber()).toBe('0.1.0');
  });
});

describe('getCurrentTimestamp', () => {
  it('ISO形式のタイムスタンプを生成すること', () => {
    const timestamp = getCurrentTimestamp();
    
    // ISO 8601形式の正規表現
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    
    expect(timestamp).toMatch(isoRegex);
  });
});

describe('generateJsonDiff', () => {
  it('2つのオブジェクトに差分がない場合は空配列を返すこと', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1 };
    
    expect(generateJsonDiff(obj1, obj2)).toEqual([]);
  });
  
  it('2つのオブジェクトに差分がある場合は差分情報を返すこと', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    
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
  
  it('プロパティの追加を検出できること', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1, b: 2 };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('b');
    expect(diffs[0].oldValue).toBeUndefined();
    expect(diffs[0].newValue).toBe(2);
    expect(diffs[0].changeType).toBe('added');
  });
  
  it('プロパティの削除を検出できること', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('b');
    expect(diffs[0].oldValue).toBe(2);
    expect(diffs[0].newValue).toBeUndefined();
    expect(diffs[0].changeType).toBe('removed');
  });
  
  it('ネストされたプロパティの変更を検出できること', () => {
    const obj1 = { a: { b: 1 } };
    const obj2 = { a: { b: 2 } };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('a.b');
    expect(diffs[0].oldValue).toBe(1);
    expect(diffs[0].newValue).toBe(2);
    expect(diffs[0].changeType).toBe('modified');
  });
  
  it('配列の変更を検出できること', () => {
    const obj1 = { a: [1, 2] };
    const obj2 = { a: [1, 2, 3] };
    
    const diffs = generateDetailedJsonDiff(obj1, obj2);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('a');
    expect(diffs[0].oldValue).toEqual([1, 2]);
    expect(diffs[0].newValue).toEqual([1, 2, 3]);
    expect(diffs[0].changeType).toBe('modified');
  });
});

describe('generateTextDiff', () => {
  it('2つの文字列から差分テキストを生成できること', () => {
    const text1 = 'Hello World';
    const text2 = 'Hello Claude';
    
    const diffText = generateTextDiff(text1, text2);
    
    expect(diffText).toBe('mock diff output');
  });
  
  it('コンテキスト行数を指定できること', () => {
    const text1 = 'Hello World';
    const text2 = 'Hello Claude';
    
    generateTextDiff(text1, text2, 5);
    
    // モック関数を取得
    const createPatch = vi.mocked(require('diff').createPatch);
    
    expect(createPatch).toHaveBeenCalledWith(
      'file',
      text1,
      text2,
      'old',
      'new',
      { context: 5 }
    );
  });
});

describe('sleep', () => {
  it('指定された時間待機できること', async () => {
    const start = Date.now();
    
    // 短い時間を指定（テストを速く実行するため）
    await sleep(10);
    
    const end = Date.now();
    const elapsed = end - start;
    
    // 少なくとも指定した時間は経過しているはず
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });
});
