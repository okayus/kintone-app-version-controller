/**
 * バージョン管理サービスのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionService } from './version-service';
import { ApiClient } from '../utils/api-client';
import { VERSION_FIELD_CODES } from '../constants';

// VERSION_FIELD_CODESをモック
vi.mock('../constants', () => {
  return {
    APP_IDS: {
      APP_VERSION_CONTROL: 374
    },
    VERSION_FIELD_CODES: {
      APP_ID: 'appId',
      APP_NAME: 'appName',
      VERSION_NUMBER: 'versionNumber',
      CREATED_AT: 'createdAt',
      CREATED_BY: 'createdBy',
      DATA: 'data',
      COMMENT: 'comment'
    }
  };
});

// ApiClientのモック
vi.mock('../utils/api-client', () => {
  return {
    ApiClient: vi.fn().mockImplementation(() => {
      return {
        getRecords: vi.fn().mockResolvedValue([
          {
            appId: { value: '1' },
            versionNumber: { value: '1' },
            data: { value: JSON.stringify({ name: 'App 1' }) },
            comment: { value: 'Test comment' },
            createdAt: { value: '2025-03-27T00:00:00Z' },
            createdBy: { value: [{ code: 'user1', name: 'User 1' }] }
          },
        ]),
        postRecord: vi.fn().mockResolvedValue({ id: '1001' }),
      };
    }),
  };
});

// deep-equalのモック
vi.mock('deep-equal', () => {
  return {
    default: vi.fn().mockImplementation((a, b) => {
      return a.name === b.name;
    })
  };
});

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(() => {
    versionService = new VersionService();
  });

  it('should get the latest version', async () => {
    const version = await versionService.getLatestVersion(1);
    expect(version).not.toBeNull();
    expect(version?.versionNumber).toBe('1');
  });

  it('should get version history', async () => {
    const history = await versionService.getVersionHistory(1);
    expect(history).toHaveLength(1);
    expect(history[0].versionNumber).toBe('1');
  });

  it('should compare app versions and detect changes', async () => {
    const appDetails = { appInfo: { name: 'App 2' } };
    const hasChanges = await versionService.compareAppVersions(1, appDetails);
    expect(hasChanges).toBe(true);
  });

  it('should compare app versions and detect no changes', async () => {
    const appDetails = { appInfo: { name: 'App 1' } };
    const hasChanges = await versionService.compareAppVersions(1, appDetails);
    expect(hasChanges).toBe(false);
  });

  it('should create a new version', async () => {
    const appDetails = { 
      appInfo: { 
        appId: '1',
        name: 'App 1', 
        description: 'Description'
      },
      fields: { properties: {} },
      layout: { layout: [] },
      views: { views: {} }
    };
    
    const newVersion = await versionService.createNewVersion(1, appDetails, 'New version');
    expect(newVersion.versionNumber).toBe('2');
    expect(newVersion.comment).toBe('New version');
  });

  it('should generate diff between versions', () => {
    const oldVersion = {
      versionNumber: '1',
      createdAt: '2025-03-26T00:00:00Z',
      createdBy: { code: 'user1', name: 'User 1' },
      data: { name: 'Old Name' },
      comment: 'Old comment'
    };
    
    const newVersion = {
      versionNumber: '2',
      createdAt: '2025-03-27T00:00:00Z',
      createdBy: { code: 'user1', name: 'User 1' },
      data: { name: 'New Name' },
      comment: 'New comment'
    };
    
    const diff = versionService.generateDiff(oldVersion, newVersion);
    expect(diff).toHaveLength(1);
    expect(diff[0].changeType).toBe('modified');
    expect(diff[0].oldValue).toEqual(oldVersion.data);
    expect(diff[0].newValue).toEqual(newVersion.data);
  });

  it('should return empty array if no differences', () => {
    const version1 = {
      versionNumber: '1',
      createdAt: '2025-03-26T00:00:00Z',
      createdBy: { code: 'user1', name: 'User 1' },
      data: { name: 'Same Name' },
      comment: 'Comment'
    };
    
    const version2 = {
      versionNumber: '2',
      createdAt: '2025-03-27T00:00:00Z',
      createdBy: { code: 'user1', name: 'User 1' },
      data: { name: 'Same Name' },
      comment: 'Different comment'
    };
    
    const diff = versionService.generateDiff(version1, version2);
    expect(diff).toHaveLength(0);
  });
});
