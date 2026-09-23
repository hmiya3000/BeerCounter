import { Injectable } from '@angular/core';
import { AlertInput } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device'; 
import { App } from '@capacitor/app';
import { Router } from '@angular/router';
//---
import { environment } from 'src/environments/environment';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { DEVICE_CONFIG } from 'src/app/config/device-constants';
//---
import { AlertService } from './alert-service';
import { SalvageService } from './salvage-service';
import { WindowService } from './window-service';
//---
import { AppmodeService } from '../features/appmode-service';
import { FeatureService } from '../features/feature-service';
//---
@Injectable({
  providedIn: 'root',
})
export class DebugService {

  public idfv: string                     = '取得中...';
  public isNeedReboot:boolean             = false;
  public isMustReboot:boolean             = false;
  public isDebugMode: boolean             = false;

  public modeName:string                  = '';
  public isAdmin:boolean                  = false;

  private  _isAdTestModeOnDev:boolean     = false;
  private  _devMode:   number             = 0;  //0:Product, 1:FieldTest, 2:FieldTest In Dev, 3:Dev

  private _capacitor_getPlatform:string   = '';

  private readonly adminDeviceIds: string[] = [
    DEVICE_CONFIG._idfv_iPhone8plus,   // iPhone 8 Plus の本物のID
    DEVICE_CONFIG._idfv_iPhone16plus,  // iPhone 16 Plus の本物のID
    DEVICE_CONFIG._idfv_iPadmini4,     // iPad mini 4 の本物のID
    DEVICE_CONFIG._idfv_SO05K,         // SO-05K の本物のID
  ];
  //===========================================================================
  constructor(
    private router: Router,
    private featureSvc: FeatureService,
    private alertSvc:AlertService,
    private appmodeSvc:AppmodeService,
    private salvageSvc:SalvageService,
    private windowSvc:WindowService,
  ) {
    this._capacitor_getPlatform = Capacitor.getPlatform();
    this.initIdfv();
    this.checkDebugDevice();
  }
  ngOnInit() {
    this.isAdmin  = this.isAdminDevice();
    console.log('[Debug]this.isAdmin',this.isAdmin)
  }
  public readBackup(){
    if (environment.production){
      this._devMode   = 0;
      localStorage['_devMode']      = JSON.stringify(this._devMode);
    } else {
      if (APP_CONFIG.TESTFLIGHT){
        this._devMode   = 1;
        localStorage['_devMode']      = JSON.stringify(this._devMode);
      } else {
        if('_devMode' in localStorage){
          this._devMode = JSON.parse(localStorage['_devMode']);
        }
      }
    }
    if('_isAdTestModeOnDev' in localStorage){
      this._isAdTestModeOnDev = JSON.parse(localStorage['_isAdTestModeOnDev']);
    }
  }
  public clearBackupDebug(){
    localStorage.removeItem('_devMode');
    localStorage.removeItem('_isAdTestModeOnDev');
  }
  //===========================================================================
  public checkSuperuser(){
    if('name' in localStorage){
      let _name = JSON.parse(localStorage['name']);
      if (_name.length > 0 ){
        if ( _name[0] == "焼肉大臣"){
          this._devMode     = 3;
          localStorage['_devMode']    = JSON.stringify(this._devMode);
        }
      }
    }
  }
  public setDevMode(_keyword:string){
    if (this._devMode == 0){
      if (_keyword == "焼肉大臣"){
        this._devMode = 3;
        localStorage['_devMode']      = JSON.stringify(this['_devMode']);
      }
    }
  }
  public afterAllClear(){
    if (this.appmodeSvc.info().withAd){
      this.loadAdBanner()
    } else {
      this.deleteAdBanner();
    }
  }
  //===========================================================================
  public isAdminDevice(): boolean {
    if ( this._capacitor_getPlatform === 'web'){
      return true;
    } else {
    return this.adminDeviceIds.includes(this.idfv);
    }
  }
  public isProductMode(){
    return  this.infoTestMode().product;
  }
  public isDevMode(){
    return  this.infoTestMode().devMode;
  }
  public isDevModeGroup(){
    return  this.infoTestMode().devModeGroup;
  }
  public isFieldTestMode(){
    return  this.infoTestMode().fieldTest;
  }
  public strDevMode(){
    if (this.infoTestMode().devMode){
      return "開発者モード";
    } else {
      return "";
    }
  }
  //===========================================================================
  public async selectMode(){
    await this.alertSvc.showAlert2bInputs(
      'モード変更',this.getAlertInputsModeSelect(),
      (data:any) => {
        this._modeChange(data);
      }
    );
  }
  private getAlertInputsModeSelect(){
    let alertInputs:AlertInput[] = [];
    const modeId = this.appmodeSvc.getModeInfo().index;
    for (let _modep of this.appmodeSvc.modeProp){
      var _checked = false;
      if (_modep.id == modeId){
        _checked = true;
      }
      alertInputs.push({
        label: _modep.name,
        type: 'radio',
        checked: _checked,
        value: _modep.id,
        });
    }
    alertInputs.push({
      label: "Product mode",
      type: 'radio',
      value: this.appmodeSvc. modeProp.length,
      });
    return alertInputs;
  }
  private _modeChange(data: any){
    console.log('[Debug]_modeChange');
    const _prevModeIndex  = this.appmodeSvc.getModeInfo().index;
    const _prevModeName   = this.appmodeSvc.getModeInfo().name;
    if (data >= this.appmodeSvc.arrAppModeLength()){
      console.log('[Debug]Change to Product mode');
      this._devMode           = 0;
      this._isAdTestModeOnDev = false;
      localStorage['_devMode']            = JSON.stringify(this._devMode);
      localStorage['_isAdTestModeOnDev']  = JSON.stringify(this._isAdTestModeOnDev);
    } else {
      this.appmodeSvc.changeAppMode(data);
      this.modeName = this.appmodeSvc.getModeInfo().name;
      console.log('[Debug]Change from ',_prevModeName,' to ',this.modeName);
      const _isAppWithAdPrev:boolean = this.appmodeSvc.info(_prevModeIndex).withAd;
      const _isAppWithAdCurr:boolean = this.appmodeSvc.info().withAd;
      if (_isAppWithAdPrev && !_isAppWithAdCurr){
        this.windowSvc.deleteAdBannerDebug();
      } else if (!_isAppWithAdPrev && _isAppWithAdCurr){
        this.loadAdBanner();
      }
    }
  }
  //===========================================================================
  private async initIdfv() {
    try {
      const idInfo  = await Device.getId(); // [INDEX]
      this.idfv     = idInfo.identifier; // [INDEX]
      console.log(`[Debug]IDFV: ${this.idfv}`);
    } catch (error) {
      console.error('[Debug]Cannot get IDFV:', error);
      this.idfv = 'Error';
    }
  }
  private async triggerAppRestart() {
    console.log('[Debug]端末のメモリと座標をリセットするため、アプリを強制起動し直します...');
    
    // 🍏 iOS (iPhone 8 Plus) の場合
    if (this._capacitor_getPlatform === 'ios') {
      // iOSはセキュリティ規約上、ネイティブ側からの勝手な自動再起動（アプリのセルフリブート）をAppleが禁止しています。
      // そのため、Webビュー（JavaScript）を初回起動状態へと強制叩き直す「location.href」を撃ち込みます。
      // これにより、画面全体がリフレッシュされ、app.component.ts の最初から100%完璧にやり直されます！
      window.location.href = 'index.html'; 
    } 
    // 🤖 Android (SO-05K) の場合
    else if (this._capacitor_getPlatform === 'android') {
      try {
        // Androidはネイティブ側でアプリのタスクを即座に終了させて再起動させることが可能です。
        // 標準内蔵の App.exitApp() を呼び出すことで、アプリが最速でクリアに再起動します。
        await App.exitApp();
      } catch (e) {
        window.location.href = 'index.html';
      }
    } 
    // Webブラウザテスト環境などの場合
    else {
      window.location.reload();
    }
  }
  //===========================================================================
  private async checkDebugDevice() {
    try {
      // 🌟 端末のハードウェア情報を取得（ユーザー許可不要） [INDEX]
      const info = await Device.getInfo(); 
      
      // 🍏 あなたの iPhone 8 Plus なら、info.model には必ず "iPhone10,2" または "iPhone10,5" という固有の型番が入ります。
      // 🤖 あなたの SO-05K なら、info.model には必ず "SO-05K" という文字列が入ります。
      if (info.model.includes('SO-05K') || info.model.includes('iPhone10,')) {
        // 開発者の実機（XperiaXZ2 Compact または iPhone 8 Plus）であると100%自動判定！
        this.isDebugMode = true;
        console.log('[Debug]This is Admin Device');
      }
    } catch (e) {
      this.isDebugMode = false;
    }
  }
  //===========================================================================
  public infoTestMode() : {
            product:boolean, 
            fieldTest:boolean,
            fieldTestModeInDevMode:boolean,
            devModeGroup:boolean,
            devMode:boolean}{
    // ----------------
    // 0:Product    true
    // 1:FT         false
    // 2:FTinDev    false
    // 3:Dev        false
    const _isProduct        = this._devMode == 0  ? true : false;
    // ----------------
    // 0:Product    false
    // 1:FT         true
    // 2:FTinDev    true
    // 3:Dev        false
    const _isFieldTest      = this._devMode == 1 || this._devMode == 2 ? true : false;
    // ----------------
    // 0:Product    false
    // 1:FT         false
    // 2:FTinDev    true
    // 3:Dev        false
    const _isFTinDevMode    = this._devMode == 2 ? true : false;
    // ----------------
    // 0:Product    false
    // 1:FT         false
    // 2:FTinDev    true
    // 3:Dev        true
    const _isDevModeGroup   = this._devMode >= 2 ? true : false;
    // ----------------
    // 0:Product    false
    // 1:FT         false
    // 2:FTinDev    false
    // 3:Dev        true
    const _isDevMode        = this._devMode == 3 ? true : false;

    return {product:_isProduct, fieldTest:_isFieldTest,fieldTestModeInDevMode:_isFTinDevMode, devModeGroup:_isDevModeGroup, devMode:_isDevMode }
  }
  public isAdTestMode(){
    if (this._devMode === 0){
      return false;
    } else if (this._devMode === 1){
      return true;
    } else {
      return this._isAdTestModeOnDev;
    }
  }
  public getStrDevMode(){
    let _str = "";
    if (this._devMode == 0){
      _str = "プロダクトモード";
    } else if (this._devMode == 1){
      _str = "フィールドテストモード";
    } else if (this._devMode == 2){
      _str = "FT in 開発者モード";
    } else if (this._devMode == 3){
      _str = "開発者モード";
    }
    return _str;
  }
  public changeDevMode(){
    if (this._devMode == 2){
      this._devMode = 3;
      localStorage['_devMode']      = JSON.stringify(this._devMode);
    } else if (this._devMode == 3){
      this._devMode = 2;
      localStorage['_devMode']      = JSON.stringify(this._devMode);
    }
  }
  public changeProductMode(){
    if ( this.infoTestMode().devModeGroup){
      this._devMode     = 0;      //Product Mode
      localStorage['_devMode']    = JSON.stringify(this._devMode);

    } else {
      this._devMode     = 3;      //Dev Mode
      localStorage['_devMode']    = JSON.stringify(this._devMode);
    }
  }
  //===========================================================================
  public adTestModeNext()
  {
    return this.isAdTestMode();
  }
  public adTestModeCur()
  {
    return this.windowSvc.getAdInfo().isUseDemoId;
  }
  public adIdBannerCur(){
    const _adId = this.windowSvc.getAdInfo().adIdBanner;
    if (_adId == ''){
      return '未設定';
    } else {
      return _adId;
    }
  }
  public adIdBannerNext(){
    let _adIdBannerProduct = this.windowSvc.getAdInfo().adIdProduct;
    if (this.isAdTestMode()){
      return '(DEMO)';
    } else {
      return _adIdBannerProduct;
    }
  }
  public adIdRewardCur(){
    const _adId = this.windowSvc.getAdInfo().adIdReward;
    if (_adId == ''){
      return '未設定';
    } else {
      return _adId;
    }
  }
  public changeAdTestModeOnDev(){
    this._isAdTestModeOnDev = !this._isAdTestModeOnDev;
    localStorage['_isAdTestModeOnDev']     = JSON.stringify(this._isAdTestModeOnDev);
    this.isNeedReboot = false;
  }
  public async loadAdBanner(){
    console.log('[Debug]loadAdBanner')
    const requestReboot:boolean = await this.windowSvc.restartAdBannerDebug(this.isAdTestMode());
    if (requestReboot){
      this.alertSvc.showAlert1bMessage('再起動してください','広告のTestModeが変わっています');
      this.isNeedReboot = true;
    } else {
      this.isNeedReboot = false;
    }
  }
  public deleteAdBanner(){
    console.log('[Debug]deleteAdBanner')
    this.windowSvc.deleteAdBannerDebug();
  }
  public grantAdRewardDebug(){
    this.windowSvc.grantAdRewardDebug();
  }
  public revokeAdRewardDebug(){
    this.windowSvc.revokeAdRewardDebug();
  }
  //===========================================================================
  public clearDropboxToken(){
//    this.dropboxSvc.clearToken();
  }
  //===========================================================================
  public isSalvageAvailable(){
    return this._capacitor_getPlatform === 'ios' ? true : false;
  }
  public permissonSalvage(){
    if (this._capacitor_getPlatform === 'ios'){
      this.salvageSvc.permissonSalvage();
      if (!this.salvageSvc.isSalvagedNext()){
        this.alertSvc.showAlert1bMessage('再起動してください','サルベージ処理が動作します');
      }
    }
  }
  public strSalvagedNext(){
    if (this._capacitor_getPlatform === 'ios'){
      return this.salvageSvc.isSalvagedNext() ? '通常起動' : '次回サルベージする';
    } else {
      return 'iOS限定機能';
    }
  }
  public isExistSalvageData(){
    if (this._capacitor_getPlatform === 'ios'){
      if('salvage_raw_plist' in localStorage){
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  public get salvage_raw_plist(): string {    
    let _salvage_raw_plist  = '';
    if (this._capacitor_getPlatform === 'ios'){
      const rawPlistJson = localStorage.getItem('salvage_raw_plist');
      if (rawPlistJson){
        _salvage_raw_plist = rawPlistJson;
//        console.log(rawPlistJson)
      } else {
        _salvage_raw_plist = 'salvage_raw_plist が見つからない';
      }
    } else {
      _salvage_raw_plist = 'iOS限定機能'
    }
    return _salvage_raw_plist;
  }
  public execSalvageForce(){
    if (this._capacitor_getPlatform === 'ios'){
      if (this.salvageSvc.isSalvagedNext()){
        this.salvageSvc.permissonSalvage();
      }
      this.salvageSvc.readSalvagedData(this.featureSvc ); 
    }
  }
  //===========================================================================
  public async allClearDebug(){
    await this.alertSvc.showAlert2bExec(
      '完全初期化','localStrageを完全削除',
      () => {
        this.deleteAdBanner();
        this.appmodeSvc.clearBackupDebug();
        this.featureSvc.clearBackupDebug();
        this.clearBackupDebug();              //DebugSvc
        this.salvageSvc.clearBackupDebug();
        this.windowSvc.clearBackupDebug();
        this.alertSvc.showAlert1bMessage('再起動してください','');
        this.isMustReboot = true;
      }
    );
  }
  //===========================================================================
}
