/**
 * アプリ一覧バックアップメイン処理
 * アプリ一覧ページにボタンを追加し、バックアップ処理を実行する
 */
import { AppService, VersionService } from './services';
import { createButton, Notification, ProgressIndicator } from './components';
import { APP_IDS, EVENT_TYPES, CUSTOMIZE_IDS } from './constants';
import { sleep } from './utils/helpers';

/**
 * アプリ一覧バックアッププロセスクラス
 */
export class AppListBackup {
  private appService: AppService;
  private versionService: VersionService;
  private progressIndicator: ProgressIndicator | null = null;
  
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
      console.error('ヘッダーメニュー要素が見つかりません');
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
  }
  
  /**
   * バックアップボタンクリック時の処理
   */
  private async handleBackupClick(event: MouseEvent) {
    event.preventDefault();
    
    try {
      // 確認ダイアログ
      if (!confirm('アプリ設定のバックアップを開始しますか？')) {
        return;
      }
      
      // 処理中はボタンを無効化
      const button = document.getElementById(CUSTOMIZE_IDS.BACKUP_BUTTON) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'バックアップ中...';
      }
      
      // バックアップ処理を実行
      await this.executeBackup();
      
      // 処理完了を通知
      Notification.success('アプリ設定のバックアップが完了しました');
    } catch (error) {
      console.error('バックアップ処理中にエラーが発生しました', error);
      Notification.error('バックアップ処理中にエラーが発生しました');
    } finally {
      // ボタンを再有効化
      const button = document.getElementById(CUSTOMIZE_IDS.BACKUP_BUTTON) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'アプリ設定バックアップ';
      }
      
      // プログレスインジケーターを削除
      this.removeProgressIndicator();
    }
  }
  
  /**
   * バックアップ処理の実行
   */
  async executeBackup() {
    try {
      // 全アプリの情報を取得
      const apps = await this.appService.getAllApps();
      
      // 進捗表示用のプログレスインジケーターを作成
      this.createProgressIndicator(apps.length);
      
      // 更新されたアプリの数
      let updatedCount = 0;
      
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
          }
        } catch (error) {
          console.error(`アプリ ${app.name} (ID: ${app.appId}) の処理中にエラーが発生しました`, error);
          // エラーが発生しても処理を続行
          continue;
        }
      }
      
      // 処理結果の通知
      if (updatedCount > 0) {
        Notification.success(`${updatedCount} 個のアプリの設定変更を検出し、バックアップしました`);
      } else {
        Notification.info('設定変更のあるアプリはありませんでした');
      }
      
      return { total: apps.length, updated: updatedCount };
    } catch (error) {
      console.error('バックアップ処理実行中にエラーが発生しました', error);
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
    
    // 本文の直前に挿入
    const contentElement = document.querySelector('.gaia-argoui-app-content');
    if (contentElement) {
      contentElement.insertBefore(
        this.progressIndicator.container,
        contentElement.firstChild
      );
    }
  }
  
  /**
   * プログレスインジケーターを更新
   * @param value 現在の値
   * @param label ラベル
   */
  private updateProgress(value: number, label?: string) {
    if (this.progressIndicator) {
      this.progressIndicator.setValue(value);
      
      if (label) {
        // ラベルを更新する実装（実際のProgressIndicatorクラスには実装されていない）
        // this.progressIndicator.setLabel(label);
      }
    }
  }
  
  /**
   * プログレスインジケーターを削除
   */
  private removeProgressIndicator() {
    if (this.progressIndicator) {
      this.progressIndicator.remove();
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
