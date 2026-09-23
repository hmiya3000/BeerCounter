import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { BehaviorSubject } from 'rxjs';
//---
import { DROPBOX_CONFIG } from 'src/app/config/dropbox-constants';
import { Util } from 'src/app/utils/util';

export interface DropboxFileMetadata {
  '.tag': 'file' | 'folder' | 'deleted'; // 💡 .tag は特殊な文字なのでクォーテーションで囲みます
  name: string;                          // ファイル名
  path_lower: string;                    // 小文字に統一されたパス
  path_display: string;                  // ストア表示用のパス
  id: string;                            // Dropbox内の一意のID
  
  // --- 以下は '.tag' が 'file' の時のみ存在するプロパティ ---
  client_modified?: string;              // クライアント側の更新日時（ISO 8601）
  server_modified?: string;              // サーバー側の更新日時（ISO 8601）
  rev?: string;                          // リビジョンID
  size?: number;                         // ファイルサイズ（バイト）
  is_downloadable?: boolean;             // ダウンロード可能か
  content_hash?: string;                 // ハッシュ値
  property_groups?: any[];               // 拡張属性グループ
}
export interface DropboxListFolderResponse {
  entries: DropboxFileMetadata[];        // 💡 この中に上で定義したファイルの配列が入ります
  cursor: string;                        // 次のページを読み込むためのカーソル
  has_more: boolean;                     // まだ続きのファイルがあるか
}

interface FetchRequest {
  url: string
  options: object
}
//=============================================================================
@Injectable({
  providedIn: 'root'
})
export class DropboxService {

  public  event$                    = new BehaviorSubject<void>(undefined);
  private redirectUri:string        = DROPBOX_CONFIG.REDIRECT_URL;
  private currentAccessToken:string = '';
  private clientId:string           = DROPBOX_CONFIG.API_KEY;
  private refreshToken:string       = ''; 
  //===========================================================================
  constructor(
  ) {
  }
  //===========================================================================
  public async initialize() {
    this.loadSavedToken();

    console.log('[Dropbox] ① initialize() が呼び出されました。監視リスナーを設置します。');

    App.addListener('appUrlOpen', async (data) => {
      console.log('[Dropbox] 🚨 iOSネイティブからの帰還イベントを受信しました！:', data.url);
      const url = data.url;
      
      if (url && url.includes('dropbox-callback')) {
        try {
          // ⭕️ 人間が「完了」を押す前に、プログラムがブラウザを強制クローズ！
          await Util.closeIntBrowser();
          console.log('[Dropbox] ブラウザを自動クローズしました。');

          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');

          if (code) {
            const isLinked = await this.handleAuthorizationCode(code);
            if (isLinked) {
              console.log('[Dropbox] 連携成功');
            } else {
              console.log('[Dropbox] 連携失敗');
            }
          }
        } catch (e) {
          console.error('[Dropbox] 連携失敗:', e);
        }
        this.event$.next();
      }
    });
  }
  public isPageActive(_pageInstance:any): boolean {
    if (!_pageInstance?.constructor) return false;
    const selector = (_pageInstance.constructor as any).ɵcmp?.selectors?.[0]?.[0];
    if (!selector) {
      console.error('[Dropbox][isPageActive警告] セレクター名を取得できませんでした');
      return false;
    }
    // 確実な offsetHeight 判定を実行
    const element = document.querySelector(selector) as HTMLElement;
    return element ? element.offsetHeight > 0 : false;
  }
  public async clearToken(): Promise<boolean> {
    try {
      // 1. スマホ内（Preferences）の永続鍵を完全に消去
      await Preferences.remove({ key: 'dropbox_refresh_token' });
      
      // 2. サービス内部でキープしているメモリ上の変数も安全に空っぽにリセット
      this.refreshToken = '';
      this.currentAccessToken = '';
      
      console.log('[Dropbox] 連携データを完全にリセットしました。');
      return true;
    } catch (e) {
      console.error('[Dropbox] リセット処理中にエラー:', e);
      return false;
    }
  }
  public hasToken() : boolean{
    if (this.refreshToken !== ''){
      return true;
    } else {
      return false;
    }
  }
  //===========================================================================
  public async startLoginFlow() {
    try {
      const generatedVerifier = this.generateRandomString(64);
      await Preferences.set({ key: 'dropbox_code_verifier', value: generatedVerifier });
      const challenge = await this.generateS256Challenge(generatedVerifier);
      const baseUrl = 'https://www.dropbox.com/oauth2/authorize'; 
      const params = new URLSearchParams({
        client_id: this.clientId.trim(),
        token_access_type: 'offline', 
        response_type: 'code',        
        redirect_uri: this.redirectUri, 
        code_challenge_method: 'S256',
        code_challenge: challenge
      });
      const authUrl = `${baseUrl}?${params.toString()}`;
      console.log('[Dropbox] 最終認証URL:', authUrl);
      await Util.openIntBrowser(authUrl);
    } catch (e) {
      console.error(e);
    }
  }
  //===========================================================================
  public async getFileList(path: string = '') : Promise<DropboxFileMetadata[] | null> {
    try {
      const token = await this.refreshAccessToken();
      if (!token) {
        console.error('[Dropbox] トークンの自動更新に失敗したため、リスト取得を中止します。');
        return null;
      }
      const targetPath = (path === '/' || path === DROPBOX_CONFIG.TARGET_PATH) ? '' : path;
      const options = {
        url: 'https://api.dropboxapi.com/2/files/list_folder',
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          path: targetPath,
          recursive: false,
          include_media_info: false,
          include_deleted: false,
          include_has_explicit_shared_members: false,
          include_mounted_folders: true
        }
      };
      const response = await CapacitorHttp.post(options);
      if (response.status === 200 && response.data && response.data.entries) {
        return response.data.entries as DropboxFileMetadata[];
      } else {
        console.error('[Dropbox] リスト取得失敗（ステータス違い）:', response.data);
        return null;
      }
    } catch (e) {
      console.error('[Dropbox] リスト取得通信中の重大な例外エラー:', e);
      return null;
    }
  }
  //===========================================================================
  public async downloadFile(path: string, isRetry: boolean = false, currentToken: string = ''): Promise<string | any[] | null> {
    let token = '';
    try {
      if (!isRetry){
        const refreshedToken = await this.refreshAccessToken();
        if (!refreshedToken) {
          console.error('[Dropbox] トークンの自動更新に失敗したため、ダウンロードを中止します。');
          return null;
        }
        token = refreshedToken;
      } else {
        token = currentToken;
      }
      const waitTime = isRetry ? 600 : 400;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      const safeArgJson = JSON.stringify({ path: path })
        .replace(/[\u007f-\uffff]/g, (c) => {
          return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
        });
      console.log(`[Dropbox] 🚀 [Try:${isRetry ? '2' : '1'}] Excelダウンロード通信を開始します。`);
      const url = 'https://content.dropboxapi.com/2/files/download'
      const response = await CapacitorHttp.request({
        url: url,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Dropbox-API-Arg': safeArgJson
        },
        responseType: 'arraybuffer' 
      });
      if (response.status === 200) {
        console.log('[Dropbox] ダウンロード通信成功');
        return response.data;
      } else {
        console.error('[Dropbox] ダウンロード失敗:', response.data);
        return null;
      }
    } catch (e) {
      console.error('[Dropbox] ダウンロード中の重大な例外エラー:', e);
      let errorStr = '';
      if (e instanceof Error) { errorStr = e.message; }
      else if (typeof e === 'object' && e !== null) { errorStr = JSON.stringify(e); }
      else { errorStr = String(e); }
      
      const isConnectionLost = errorStr.toLowerCase().includes('lost') || errorStr.includes('-1005');
      if (isConnectionLost && !isRetry) {
        console.warn('[Dropbox] ⚠️ 予期せぬ通信切断バグ（-1005）を検出。リトライを開始します...');        
        await new Promise(resolve => setTimeout(resolve, 50));
        return await this.downloadFile(path, true, token);
      }
      return null;
    }
  }
  //===========================================================================
  public async uploadFile(path: string, base64Data: any, isRetry: boolean = false, currentToken: string = ''): Promise<boolean> {
    let token = '';
    try {
      if (!isRetry) {
        const refreshedToken = await this.refreshAccessToken();
        if (!refreshedToken) {
          console.error('[Dropbox] トークンの自動更新に失敗したため、アップロードを中止します。');
          return false;
        }
        token = refreshedToken;
      } else {
        token = currentToken;
      }
      const waitTime = isRetry ? 600 : 400;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      let targetPath = path.trim();
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }
      const safeArgJson = JSON.stringify({
        path: targetPath,
        mode: 'overwrite', 
        autorename: false,
        mute: false,
        strict_conflict: false
      }).replace(/[\u007f-\uffff]/g, (c) => {
        return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
      });
      const url = 'https://content.dropboxapi.com/2/files/upload';
      const response = await CapacitorHttp.request({
        url: url,
        method: 'POST',
        ...({
          dataType: 'file' // ★成功実績のある実機バイナリ強制指定
        } as any),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Transfer-Encoding': 'base64',
          'Content-Type': 'application/octet-stream', 
          'Dropbox-API-Arg': safeArgJson
        },
        data: base64Data
      });
      console.log('[Dropbox] Excelアップロード通信ステータス:', response.status);
      if (response.status === 200) {
        console.log('[Dropbox] 🏆 クラウド上に本物のShift-JISバイナリファイルが完全保存されました！');
        return true;
      } else {
        console.error('[Dropbox] アップロード失敗:', response.data);
        return false;
      }
    } catch (e) {
      console.error('[Dropbox] アップロード通信中の重大な例外エラー:', e);
      let errorStr = '';
      if (e instanceof Error) {
        errorStr = e.message;
      } else if (typeof e === 'object' && e !== null) {
        errorStr = JSON.stringify(e);
      } else {
        errorStr = String(e);
      }
      const isConnectionLost = errorStr.toLowerCase().includes('lost') || errorStr.includes('-1005');
      if (isConnectionLost && !isRetry) {
        console.warn('[Dropbox] ⚠️ 予期せぬ通信切断バグ（-1005）を検出。アップロードのリトライを開始します...');        
        await new Promise(resolve => setTimeout(resolve, 50));
        return await this.uploadFile(path, base64Data, true, token);
      }
      return false;
    }
  }
  //===========================================================================
  private async loadSavedToken() {
    const { value } = await Preferences.get({ key: 'dropbox_refresh_token' });
    if (value) {
      this.refreshToken = value;
      console.log('[Dropbox] 保存されていたリフレッシュトークンをロードしました');
    }
  }
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }
  private async handleAuthorizationCode(authorizationCode: string): Promise<boolean> {
    try {
      const cleanClientId = this.clientId.trim();
      //---
      const savedVerifierResult = await Preferences.get({ key: 'dropbox_code_verifier' });
      const liveVerifier = savedVerifierResult.value;
      if (!liveVerifier) {
        console.error('[Dropbox] 🚨 金庫から code_verifier が見つからないため、鍵引き換えを中止します。');
        return false;
      }
      console.log('[Dropbox] 金庫から使い捨て code_verifier の取り出しに成功しました。引き換え通信を開始します。');
      const options = {
        url: 'https://api.dropboxapi.com/oauth2/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // 💡 引き換えの検証用として、ハッシュ化する前の「元の生の文字列（code_verifier）」を添えて送信します
        data: `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${encodeURIComponent(this.redirectUri)}&client_id=${cleanClientId}&code_verifier=${liveVerifier}`
      };
      
      const response = await CapacitorHttp.post(options);

      console.log('[Dropbox] 📡 鍵引き換え通信のステータス:', response.status);
      console.log('[Dropbox] 📦 サーバーから返ってきた生データ:', response.data);

      if (response.status === 200 && response.data && response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
        console.log('[Dropbox] 🏆 【大成功】refresh_tokenの獲得に成功しました！:', this.refreshToken);
        await Preferences.set({ key: 'dropbox_refresh_token', value: this.refreshToken });
        console.log('[Dropbox] 💾 Preferencesへの永続保存がカチッと完了しました！');
        return true;
      }
      console.warn('[Dropbox] ⚠️ 通信は届きましたが、条件を満たしていないため鍵の保存をスキップしました。');
      return false;
    } catch (e) { 
      console.error('[Dropbox] 鍵引き換え中の例外エラー:', e);
      return false; 
    }
  }
  private async generateS256Challenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    
    // Base64URLフォーマットへの変換処理
    const bytes = new Uint8Array(hash);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const cleanClientId = this.clientId.trim();
      if (!this.refreshToken) {
        const { value } = await Preferences.get({ key: 'dropbox_refresh_token' });
        if (value) this.refreshToken = value;
      }
      if (!this.refreshToken) {
        console.warn('[Dropbox] 端末内にリフレッシュトークン（永続鍵）が存在しません。先に連携を完了させてください。');
        return null;
      }
      const options = {
        url: 'https://api.dropboxapi.com/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        // 💡 完璧にスペルチェックを済ませた、Dropboxが要求するリフレッシュ専用のパラメータ文字列
        data: `grant_type=refresh_token&refresh_token=${this.refreshToken}&client_id=${cleanClientId}`
      };
      const response = await CapacitorHttp.post(options);
      console.log('[Dropbox] トークンリフレッシュ通信ステータス:', response.status);
      if (response.status === 200 && response.data && response.data.access_token) {
        this.currentAccessToken = response.data.access_token;
        console.log('[Dropbox] ✅ アクセストークンの自動リペア（更新）に成功しました！');
        return this.currentAccessToken;
      }
      console.error('[Dropbox] トークンリフレッシュ失敗レスポンス:', response.data);
      return null;
    } catch (e) {
      console.error('[Dropbox] トークンリフレッシュ通信中の例外エラー:', e);
      return null;
    }
  }
  //===========================================================================
}
