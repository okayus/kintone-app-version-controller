/**
 * 通知コンポーネント
 */

/**
 * 通知のタイプ
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/**
 * 通知のオプション
 */
export interface NotificationOptions {
  /** メッセージ */
  message: string;
  /** タイプ */
  type?: NotificationType;
  /** 表示時間（ミリ秒） */
  duration?: number;
  /** 自動的に閉じるかどうか */
  autoClose?: boolean;
}

/**
 * 通知クラス
 */
export class Notification {
  private static container: HTMLDivElement | null = null;
  private element: HTMLDivElement;
  private closeButton: HTMLButtonElement;
  private closeTimeout: number | null = null;
  
  /**
   * コンストラクタ
   * @param options 通知のオプション
   */
  constructor(options: NotificationOptions) {
    // コンテナの初期化
    if (!Notification.container) {
      Notification.container = document.createElement('div');
      Notification.container.style.position = 'fixed';
      Notification.container.style.top = '10px';
      Notification.container.style.right = '10px';
      Notification.container.style.zIndex = '10000';
      document.body.appendChild(Notification.container);
    }
    
    // 通知要素の作成
    this.element = document.createElement('div');
    this.element.style.backgroundColor = this.getBackgroundColor(options.type || 'info');
    this.element.style.color = this.getTextColor(options.type || 'info');
    this.element.style.padding = '12px 16px';
    this.element.style.marginBottom = '10px';
    this.element.style.borderRadius = '4px';
    this.element.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    this.element.style.display = 'flex';
    this.element.style.justifyContent = 'space-between';
    this.element.style.alignItems = 'center';
    this.element.style.minWidth = '300px';
    this.element.style.maxWidth = '500px';
    this.element.style.wordBreak = 'break-word';
    
    // メッセージ部分
    const messageElement = document.createElement('div');
    messageElement.textContent = options.message;
    messageElement.style.flex = '1';
    this.element.appendChild(messageElement);
    
    // 閉じるボタン
    this.closeButton = document.createElement('button');
    this.closeButton.textContent = '×';
    this.closeButton.style.background = 'transparent';
    this.closeButton.style.border = 'none';
    this.closeButton.style.color = this.getTextColor(options.type || 'info');
    this.closeButton.style.fontSize = '16px';
    this.closeButton.style.marginLeft = '10px';
    this.closeButton.style.cursor = 'pointer';
    this.closeButton.addEventListener('click', () => this.close());
    this.element.appendChild(this.closeButton);
    
    // 通知を表示
    Notification.container.appendChild(this.element);
    
    // 自動的に閉じる設定
    const autoClose = options.autoClose !== false;
    if (autoClose) {
      const duration = options.duration || 5000;
      this.closeTimeout = window.setTimeout(() => {
        this.close();
      }, duration);
    }
  }
  
  /**
   * 通知を閉じる
   */
  public close(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  
  /**
   * タイプに応じた背景色を取得する
   * @param type 通知タイプ
   * @returns 背景色
   */
  private getBackgroundColor(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '#d4edda';
      case 'info':
        return '#d1ecf1';
      case 'warning':
        return '#fff3cd';
      case 'error':
        return '#f8d7da';
      default:
        return '#d1ecf1';
    }
  }
  
  /**
   * タイプに応じたテキスト色を取得する
   * @param type 通知タイプ
   * @returns テキスト色
   */
  private getTextColor(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '#155724';
      case 'info':
        return '#0c5460';
      case 'warning':
        return '#856404';
      case 'error':
        return '#721c24';
      default:
        return '#0c5460';
    }
  }
  
  /**
   * 成功通知を表示する
   * @param message メッセージ
   * @param options 追加オプション
   * @returns 通知インスタンス
   */
  public static success(message: string, options: Partial<NotificationOptions> = {}): Notification {
    return new Notification({
      message,
      type: 'success',
      ...options,
    });
  }
  
  /**
   * 情報通知を表示する
   * @param message メッセージ
   * @param options 追加オプション
   * @returns 通知インスタンス
   */
  public static info(message: string, options: Partial<NotificationOptions> = {}): Notification {
    return new Notification({
      message,
      type: 'info',
      ...options,
    });
  }
  
  /**
   * 警告通知を表示する
   * @param message メッセージ
   * @param options 追加オプション
   * @returns 通知インスタンス
   */
  public static warning(message: string, options: Partial<NotificationOptions> = {}): Notification {
    return new Notification({
      message,
      type: 'warning',
      ...options,
    });
  }
  
  /**
   * エラー通知を表示する
   * @param message メッセージ
   * @param options 追加オプション
   * @returns 通知インスタンス
   */
  public static error(message: string, options: Partial<NotificationOptions> = {}): Notification {
    return new Notification({
      message,
      type: 'error',
      ...options,
    });
  }
}
