import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface SalvagePlugin {
  fetchOldPlistData(): Promise<{ hasData: boolean; base64Data?: string }>;
  confirmMigrationSuccess(): Promise<void>;
}
const SalvageMockPlugin = registerPlugin<SalvagePlugin>('SalvagePlugin');

@Injectable({
  providedIn: 'root',
})
export class SalvageService {

  private isSalvaged:boolean   = true;
  private _capacitor_getPlatform:string   = '';

  constructor(
  ) {
    this._capacitor_getPlatform = Capacitor.getPlatform();
  }
  //===========================================================================
  public readBackup(){
    this.isSalvaged = false;
    if('isSalvaged' in localStorage){
      this.isSalvaged       = JSON.parse(localStorage['isSalvaged']);
    }
  }
  public isSalvagedNext(){
    let isSalvagedNext = this.isSalvaged;
    if('isSalvaged' in localStorage){
      isSalvagedNext      = JSON.parse(localStorage['isSalvaged']);
    }
    return isSalvagedNext;
  }
  public async clearBackupDebug(){
    localStorage.removeItem('isSalvaged');
    localStorage.removeItem('salvage_raw_plist');
  }
  public permissonSalvage(){
    if (this._capacitor_getPlatform === 'ios'){
      if (this.isSalvaged){
        localStorage.removeItem('isSalvaged');
        this.isSalvaged = false;    
      } else {
        this.isSalvaged = true;
        localStorage['isSalvaged']  = JSON.stringify(this.isSalvaged);
      }
    }
  }
  //===========================================================================
  async startSalvageProcess(dataOwnerSvc:any ) {
    if (this._capacitor_getPlatform !== 'ios'){
      console.log('[Salvage]startSalvageProcess return')
      return;
    }

    try {
      console.log('[Salvage] ネイティブ層へ古いデータがないか問い合わせます...');
      const result = await SalvageMockPlugin.fetchOldPlistData();
      
      if (!result.hasData || !result.base64Data) {
        console.log('[Salvage] 移行対象の古いデータは存在しませんでした（新規または移行済み）。');
        return;
      }
      console.log('[Salvage] 古いデータを発見！デコード処理を開始');

      // Base64を安全に復元する、エラー0の最新ロジック
      const binaryString = atob(result.base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      const decodedJsonText = new TextDecoder('utf-8').decode(bytes);
      const oldData  = dataOwnerSvc.convertTextToData(decodedJsonText);
      console.log('[Salvage] 旧データの復元に成功、localStorageに保存します');
      await this.saveToNewStorage(oldData, dataOwnerSvc);
      console.log('[Salvage] ネイティブ層への移行完了通知を送ります');
      console.log('[Salvage] ...いや、デバッグ中なので送らない(通知送ったら旧データ削除されるので)');
      // await SalvageMockPlugin.confirmMigrationSuccess();
      // console.log('[Salvage] ネイティブ層への移行完了通知が完了しました');

    } catch (error) {
      console.error('⚠️ [Salvage] サルベージ処理中にエラーが発生しました:', error);
    }
  }
  //===========================================================================
  private async saveToNewStorage(data: any, dataOwnerSvc:any) {
    // 【ここに実際の保存処理を書く】
    localStorage.setItem('salvage_raw_plist', JSON.stringify(data));    
    this.readSalvagedData(dataOwnerSvc);
    return Promise.resolve();
  }
  //===========================================================================
  public async readSalvagedData(dataOwnerSvc:any ) {

    if (this._capacitor_getPlatform !== 'ios'){
      console.log('[Salvage]readSalvagedData return')
      return;
    }
    console.log('[Salvage]readSalvagedData()');
    if (this.isSalvaged){
      const rawPlistJson = localStorage.getItem('salvage_raw_plist');
      if (rawPlistJson == null){
        console.log('[Salvage]Not found:salvage_raw_plist')
      } else {
//        console.log('[Salvage]salvage_raw_plist',rawPlistJson)
      }
      console.log('[Salvage]isSalvaged=true  Already salvaged.do nothing')
      return;
    }
    try {
      // 💡 ネイティブ側からの時間差インジェクションの着地を待つために、250msだけ確実に待ち合わせします
      await new Promise(resolve => setTimeout(resolve, 250));
      const rawPlistJson = localStorage.getItem('salvage_raw_plist');

      if (rawPlistJson) {
//////        console.log('[Salvage]salvage_raw_plist',rawPlistJson)
        const oldData = JSON.parse(rawPlistJson);
        await dataOwnerSvc.recoveryData(oldData);
        localStorage.removeItem('salvage_raw_plist');
        this.isSalvaged = true;
        console.log('[Salvage]旧データの反映が完了');
        await dataOwnerSvc.salvageFin(true);
      } else {
        console.log('[Salvage]salvage_raw_plistがない。サルベージ済？通常起動を行います');
        this.isSalvaged = true; //サルベージ済だと
        await dataOwnerSvc.salvageFin(false);
      }
      localStorage['isSalvaged']  = JSON.stringify(this.isSalvaged);
    } catch (error) {
      console.error('[Salvage]Read error:', error);
      await dataOwnerSvc.errorRecoveryData();
      await dataOwnerSvc.salvageFin(false);
    }
  }
  //===========================================================================
}

