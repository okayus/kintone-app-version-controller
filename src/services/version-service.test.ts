/**
 * バージョン管理サービスのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionService } from './version-service';
import { ApiClient } from '../utils/api-client';
import { VERSION_FIELD_CODES } from '../constants';

// diffモジュールをモック
vi.mock('diff', () => {
  return {
    diffJson: vi.fn().mockImplementation(() => [
      { added: true, value: '{"new": "value"}' },
      { removed: true, value: '{"old": "value"}' },
      { value: '{"unchanged": "value"}' }
    ])
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
            version: { value: '1.0.0' },
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
    expect(version?.versionNumber).toBe('1.0.0');
  });

  it('should get version history', async () => {
    const history = await versionService.getVersionHistory(1);
    expect(history).toHaveLength(1);
    expect(history[0].versionNumber).toBe('1.0.0');
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
    expect(newVersion.versionNumber).toBe('1.0.1');
    expect(newVersion.comment).toBe('New version');
  });

  it('should generate diff between versions', () => {
    const oldVersion = {
      versionNumber: '1.0.0',
      createdAt: '2025-03-26T00:00:00Z',
      createdBy: { code: 'user1', name: 'User 1' },
      data: { name: 'Old Name' },
      comment: 'Old comment'
    };
    
    const newVersion = {
      versionNumber: '1.0.1',
      createdAt: '2025-03-27T00:00:00Z',
      createdBy: { code: 'user1', name: 'User 1' },
      data: { name: 'New Name' },
      comment: 'New comment'
    };
    
    const diff = versionService.generateDiff(oldVersion, newVersion);
    expect(diff).toHaveLength(3);
    expect(diff[0].changeType).toBe('added');
    expect(diff[1].changeType).toBe('removed');
  });
});