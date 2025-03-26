/**
 * アプリ一覧バックアップメイン処理
 * アプリ一覧ページにボタンを追加し、バックアップ処理を実行する
 */
import { AppService, VersionService } from './services';
import { createButton, Notification, ProgressIndicator } from './components';
import { APP_IDS, EVENT_TYPES, CUSTOMIZE_IDS } from './constants';
import { sleep } from './utils/helpers';
import { logError, logInfo } from './utils/logger';

/**
 * アプリ一覧バックアッププロセスクラス
 */
export class AppListBackup {
  private appService: AppService;
  private versionService: VersionService;
  private progressIndicator: ProgressIndicator | null = null;
  private isProcessing: boolean = false;
  
  /**
   * コンストラクタ
   * @param appServiceOrBaseUrl AppServiceインスタンスまたはベースURL
   * @param versionService VersionServiceインスタンス
   */
  constructor(appServiceOrBaseUrl?: AppService | string, versionService?: VersionService) {
    if (appServiceOrBaseUrl instanceof AppService) {
      // テスト用：既存のサービスインスタンスを使用
      this.appService = appServiceOrBaseUrl;
      this.versionService = versionService || new VersionService();
    } else {
      // 新規サービスインスタンス作成
      const baseUrl = typeof appServiceOrBaseUrl === 'string' ? appServiceOrBaseUrl : undefined;
      this.appService = new AppService(baseUrl);
      this.versionService = new VersionService(baseUrl);
    }
  }
  
  /**
   * バックアップボタンを追加する処理
   */
  addBackupButton() {
    // ヘッダーメニューの要素を取得
    const headerMenuElement = document.querySelector('.gaia-argoui-app-toolbar-menu');
    
    if (!headerMenuElement) {
      logError('ヘッダーメニュー要素が見つかりません');
      return;
    }
    
    // 既存のボタンがあれば削除
    const existingButton = document.getElementById(CUSTOMIZE_IDS.BACKUP_BUTTON);
    if (existingButton) {
      existingButton.remove();
    }
    
    // バックアップボタンを作成
    const backupButton = createButton({
      text: 'アプリ設定バックアップ',
      onClick: this.handleBackupClick.bind(this),
      style: 'primary',
      id: CUSTOMIZE_IDS.BACKUP_BUTTON,
    });
    
    // ボタンをヘッダーメニューに追加
    headerMenuElement.appendChild(backupButton);
    logInfo('バックアップボタンが追加されました');
  }
  
  /**
   * バックアップボタンクリック時の処理
   */
  private async handleBackupClick(event: MouseEvent) {
    event.preventDefault();
    
    // 多重実行防止
    if (this.isProcessing) {
      Notification.warning('すでにバックアップ処理が実行中です');
      return;
    }
    
    try {
      // 確認ダイアログ
      if (!confirm('アプリ設定のバックアップを開始しますか？')) {
        return;
      }
      
      this.isProcessing = true;
      
      // 処理中はボタンを無効化
      const button = document.getElementById(CUSTOMIZE_IDS.BACKUP_BUTTON) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'バックアップ中...';
      }
      
      // バックアップ処理を実行
      const result = await this.executeBackup();
      
      // 処理完了を通知
      if (result && result.updated > 0) {
        Notification.success(`アプリ設定のバックアップが完了しました（${result.updated}/${result.total}個のアプリを更新）`);
      } else {
        Notification.info('設定変更のあるアプリはありませんでした');
      }
    } catch (error) {
      logError('バックアップ処理中にエラーが発生しました', error);
      Notification.error(`バックアップ処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      // ボタンを再有効化
      const button = document.getElementById(CUSTOMIZE_IDS.BACKUP_BUTTON) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'アプリ設定バックアップ';
      }
      
      // プログレスインジケーターを削除
      this.removeProgressIndicator();
      this.isProcessing = false;
    }
  }
  
  /**
   * バックアップ処理の実行
   */
  async executeBackup() {
    try {
      // 全アプリの情報を取得
      logInfo('全アプリの情報を取得しています...');
      const apps = await this.appService.getAllApps();
      
      if (!apps || apps.length === 0) {
        Notification.warning('バックアップ対象のアプリが見つかりませんでした');
        return { total: 0, updated: 0 };
      }
      
      // 進捗表示用のプログレスインジケーターを作成
      this.createProgressIndicator(apps.length);
      
      // 更新されたアプリの数
      let updatedCount = 0;
      // エラーが発生したアプリの数
      let errorCount = 0;
      
      // 各アプリに対して処理を実行
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        
        try {
          // 進捗表示を更新
          this.updateProgress(i + 1, `${app.name} (ID: ${app.appId}) の処理中...`);
          
          // 不要なAPIリクエストを抑制するための待機
          await sleep(100);
          
          // アプリの詳細情報を取得
          const appDetails = await this.appService.getAppDetails(parseInt(app.appId, 10));
          
          // バージョン比較で変更があるか確認
          const hasChanges = await this.versionService.compareAppVersions(
            parseInt(app.appId, 10),
            appDetails
          );
          
          // 変更があれば新バージョン作成
          if (hasChanges) {
            await this.versionService.createNewVersion(
              parseInt(app.appId, 10),
              appDetails
            );
            updatedCount++;
            logInfo(`アプリ "${app.name}" (ID: ${app.appId}) の新バージョンを作成しました`);
          } else {
            logInfo(`アプリ "${app.name}" (ID: ${app.appId}) に変更はありません`);
          }
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          logError(`アプリ "${app.name}" (ID: ${app.appId}) の処理中にエラーが発生しました: ${errorMessage}`, error);
          
          // エラーが発生してもプログレスバーとメッセージを更新
          this.updateProgress(i + 1, `エラー: ${app.name} (ID: ${app.appId})`);
          
          // エラーが発生しても処理を続行
          continue;
        }
      }
      
      // 処理結果の通知
      if (errorCount > 0) {
        Notification.warning(`${errorCount}個のアプリでエラーが発生しました。ログを確認してください。`);
      }
      
      logInfo(`バックアップ処理が完了しました。合計: ${apps.length}、更新: ${updatedCount}、エラー: ${errorCount}`);
      return { total: apps.length, updated: updatedCount, error: errorCount };
    } catch (error) {
      logError('バックアップ処理の実行中に致命的なエラーが発生しました', error);
      throw error;
    }
  }
  
  /**
   * プログレスインジケーターを作成
   * @param total 合計数
   */
  private createProgressIndicator(total: number) {
    // 既存のプログレスインジケーターがあれば削除
    this.removeProgressIndicator();
    
    // プログレスインジケーターを作成
    this.progressIndicator = new ProgressIndicator({
      id: CUSTOMIZE_IDS.PROGRESS_INDICATOR,
      max: total,
      value: 0,
      width: '100%',
      height: '20px',
      showLabel: true,
    });
    
    // ステータス表示用のラベル要素を追加
    const statusLabel = document.createElement('div');
    statusLabel.id = `${CUSTOMIZE_IDS.PROGRESS_INDICATOR}-status`;
    statusLabel.style.margin = '5px 0';
    statusLabel.textContent = 'バックアップ処理を開始しています...';
    
    // コンテナ作成
    const container = document.createElement('div');
    container.id = `${CUSTOMIZE_IDS.PROGRESS_INDICATOR}-container`;
    container.style.margin = '10px 0';
    container.style.padding = '10px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.border = '1px solid #e0e0e0';
    container.style.borderRadius = '4px';
    
    // 要素を追加
    container.appendChild(this.progressIndicator.container);
    container.appendChild(statusLabel);
    
    // 本文の直前に挿入
    const contentElement = document.querySelector('.gaia-argoui-app-content');
    if (contentElement) {
      contentElement.insertBefore(
        container,
        contentElement.firstChild
      );
    }
    
    // コンテナへの参照を保持
    (this.progressIndicator as any).statusContainer = container;
    (this.progressIndicator as any).statusLabel = statusLabel;
  }
  
  /**
   * プログレスインジケーターを更新
   * @param value 現在の値
   * @param label ステータスラベル
   */
  private updateProgress(value: number, label?: string) {
    if (this.progressIndicator) {
      this.progressIndicator.setValue(value);
      
      // ラベルを更新
      if (label && (this.progressIndicator as any).statusLabel) {
        (this.progressIndicator as any).statusLabel.textContent = label;
      }
    }
  }
  
  /**
   * プログレスインジケーターを削除
   */
  private removeProgressIndicator() {
    if (this.progressIndicator) {
      // コンテナごと削除
      if ((this.progressIndicator as any).statusContainer) {
        (this.progressIndicator as any).statusContainer.remove();
      } else {
        this.progressIndicator.remove();
      }
      this.progressIndicator = null;
    }
  }
}

/**
 * kintoneカスタマイズJSのエントリーポイント
 */
(function() {
  'use strict';
  
  // アプリ一覧ページの表示イベント
  kintone.events.on(EVENT_TYPES.INDEX_SHOW, (event) => {
    // アプリ一覧アプリでのみ実行
    if (event.appId === APP_IDS.APP_LIST) {
      const backup = new AppListBackup();
      backup.addBackupButton();
    }
    return event;
  });
})();
