import { ElementRef, Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subject, BehaviorSubject} from 'rxjs';
import { App } from '@capacitor/app'; 
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { PluginListenerHandle,Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
//---
import { APP_CONFIG } from 'src/app/config/app.constants';
import { AdService } from './ad-service';
import { DeviceService } from './device-service';
//---
@Injectable({
  providedIn: 'root',
})
export class WindowService {

  private static readonly HEADER_HEIGHT_DEFAULT   = 56;
  private static readonly SVH_DEFAULT             = 720;
  private static readonly SVW_DEFAULT             = 360;
  private static readonly SAFEAREA_TOP_P_IOS      = 47;
  private static readonly SAFEAREA_BTM_P_IOS      = 34;
  private static readonly SAFEAREA_TOP_L_IOS      = 0;
  private static readonly SAFEAREA_BTM_L_IOS      = 21;
  private static readonly SAFEAREA_TOP_P_AND      = 24;
  private static readonly SAFEAREA_BTM_P_AND      = 48;
  private static readonly SAFEAREA_BTM_P_AND_OLD  = 40;     // 画面が極端に狭い古い端末用のバーサイズ

  public layoutChanged$       = new BehaviorSubject<void>(undefined);
  public orientationOnly$     = new Subject<boolean>();
  private orientationListener!: PluginListenerHandle;
  private _capacitor_getPlatform      = '';
  private isAppWithAd:boolean         = false;

  currentOrientation: string    = '';
  public isPortrait:boolean           = false;
  public isTablet:boolean             = false;
  
  public navigationBarHeight:number   = WindowService.SAFEAREA_BTM_P_AND;
  public adBannerHeight:number        = 0;
  public svh:number                   = WindowService.SVH_DEFAULT;
  public svw:number                   = WindowService.SVW_DEFAULT;
  public safeAreaBottom:number        = 0;
  public margin:number                = 5;

  private cssPaddingBottomCurr:number         = -1;
  private _adBannerHeightPortraitInit:number  = 0;
  private _adBannerHeightLandscapeInit:number = 0;
  private _headerHeightInit:number            = WindowService.HEADER_HEIGHT_DEFAULT;
  private _adBannerHeightInitDebug:number     = 0;
  
  private isKeyboardNowVisible: boolean       = false; //キーボード表示状態
  private isModalNowVisible: boolean          = false; //広告なしモーダル表示状態

  private _adRewardExpireDate:number          = 0;

  private keyboardShowListener!: PluginListenerHandle;
  private keyboardHideListener!: PluginListenerHandle;


  //===========================================================================
  constructor(
    private platform: Platform,
    public adSvc: AdService,
    private deviceSvc: DeviceService,
  ){
    this._capacitor_getPlatform = Capacitor.getPlatform();
    this._auditSafeAreaPlugin(  this._capacitor_getPlatform);
    this.initializeKeyboard(    this._capacitor_getPlatform);
  }

  public async initialize(_isAppWithAd:boolean, _isAdTestMode:boolean){
    if (this._capacitor_getPlatform === 'android'){
      await ScreenOrientation.lock({ orientation: 'portrait' });  //回転によるAdMobのクラッシュ解消まで横向き禁止
    }
    this.isAppWithAd    = _isAppWithAd;

    await this.initStatusBarThemeListener();
    await this.deviceSvc.initialize();
    //---
    await this.getOrientation();
    if (this.isAppWithAd){
      await this.adSvc.initialize(_isAdTestMode);
      console.log('[Window]AdReward granted?')
      await this.adSvc.checkAndAutoReviveBanner(this);
    }
  }
  public finalize(){
    if (this.orientationListener){
      this.orientationListener.remove(); // 監視をストップしてメモリを解放
    }
  }
  public readBackup(){
    this._adBannerHeightPortraitInit    = 0;
    if('_adBannerHeightPortraitInit' in localStorage){
      this._adBannerHeightPortraitInit  = JSON.parse(localStorage['_adBannerHeightPortraitInit']);
    }
    this._adBannerHeightLandscapeInit   = 0;
    if('_adBannerHeightLandscapeInit' in localStorage){
      this._adBannerHeightLandscapeInit = JSON.parse(localStorage['_adBannerHeightLandscapeInit']);
    }
    this._headerHeightInit              = WindowService.HEADER_HEIGHT_DEFAULT;
    if('_headerHeightInit' in localStorage){
      this._headerHeightInit            = JSON.parse(localStorage['_headerHeightInit']);
    }
    this._adRewardExpireDate            = 0;
    if('_adRewardExpireDate' in localStorage){
      this._adRewardExpireDate          = JSON.parse(localStorage['_adRewardExpireDate']);
    }
  }
  public clearBackup(){
    localStorage.removeItem('_adBannerHeightPortraitInit');
    localStorage.removeItem('_adBannerHeightLandscapeInit');
    localStorage.removeItem('_headerHeightInit');
    this._adBannerHeightPortraitInit  = 0;
    this._adBannerHeightLandscapeInit = 0;
    this._headerHeightInit            = WindowService.HEADER_HEIGHT_DEFAULT;
  }
  public clearBackupDebug(){
    this.clearBackup();
    localStorage.removeItem('_adRewardExpireDate');
  }
  public async loadAdBanner(){
    if (this.isAppWithAd){
      await this.adSvc.loadAdBanner(this);
    }
  }
  //===========================================================================
  //--- for Debug
  public async restartAdBannerDebug(_isAdTestMode:boolean){
    console.log('[Window]restartAdBannerDebug');
    let _requestReboot = false;
    if (this._adBannerHeightInitDebug != 0){
      this.adBannerHeight               = this._adBannerHeightInitDebug;
      this._adBannerHeightPortraitInit  = this._adBannerHeightInitDebug;
    }
    console.log('[Window]adBannerHeight',this.adBannerHeight)
    //---
    if (this.adSvc.isInitialized()){
      if (this.adSvc.adTestModeCur() == _isAdTestMode){
        //そのままstart
        await this.adSvc.loadAdBanner(this);
      } else {
        //初期化のパラメータが変わるので再起動
        console.log('[Window]要再起動');
        _requestReboot  = true;
      }
    } else {
      //未初期化なのでinitializeから実行
      await this.adSvc.initialize(_isAdTestMode);
      await this.adSvc.loadAdBanner(this);
    }
    return _requestReboot;
  }
  public deleteAdBannerDebug(){
    console.log('[Window]deleteAdBannerDebug');
    this._adBannerHeightInitDebug     = this._adBannerHeightPortraitInit;
    this.adBannerHeight               = 0;
    this._adBannerHeightPortraitInit  = 0;
    localStorage['_adBannerHeightPortraitInit'] = JSON.stringify(this._adBannerHeightPortraitInit);
    console.log('[Window]adBannerHeight',this.adBannerHeight)
    //---
    if (this.adSvc.isInitialized()){
      this.clearBackup();
      this.adSvc.unloadAdBanner(this);
    }
  }
  public grantAdRewardDebug(){
    this.adSvc.grantAdRewardDebug(this);
  }
  public async revokeAdRewardDebug(){
    localStorage.removeItem('_adRewardExpireDate'); // 引き出しをお掃除
    this._adRewardExpireDate = 0;
    await this.adSvc.checkAndAutoReviveBanner(this);
  }
  //--- for Debug ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //===========================================================================
  private async updateStatusBarTheme(){

    if (this._capacitor_getPlatform !== 'web'){
      const isDarkMode: boolean = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDarkMode) {
        await StatusBar.setStyle({ style: Style.Dark });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
      }
    }
  }
  private initStatusBarThemeListener() {
    // 1. 起動した瞬間の文字色を即座に反映
    this.updateStatusBarTheme();

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', async () => {
      console.log('[Window] Web側のカラー設定変更を検知しました');
      await this.updateStatusBarTheme();
    });
    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        console.log('[Window] アプリがフォアグラウンドに戻りました。最新設定に更新します');
        await this.updateStatusBarTheme();
      }
    });
  }
  //===========================================================================
  private _auditSafeAreaPlugin(_capacitor_getPlatform:string){
    if (_capacitor_getPlatform === 'web') {
      return;
    }
    const isPluginInstalled = Capacitor.isPluginAvailable('SafeArea');
    if (!isPluginInstalled) {
      console.error('[Window]',
        '%c%s',
        'color: white; background-color: #ff3333; font-size: 16px; font-weight: bold; padding: 8px; border-radius: 4px;',
        `[⚠️ REALESTATE-DATABASE CRITICAL WARNING]`
      );
      console.error('[Window]',
        `%c🚨 インフラの致命的な欠落を検知しました！\n` +
        `前作『CompareLoan』と同じ svh: 720 マス大開通（Edge-to-Edge）を成立させるための\n` +
        `「 @capacitor-community/safe-area 」プラグインが、このプロジェクトの床に合流していません。\n\n` +
        `【今すぐ執行すべきお直しコマンド】:\n` +
        ` ➔ npm install @capacitor-community/safe-area@8.0.1 --legacy-peer-deps\n` +
        ` ➔ npx cap sync android`,
        'color: #ff3333; font-size: 13px; font-weight: bold;'
      );
    } else {
      console.log('[Window]',
        '%c%s',
        'color: white; background-color: #2dd36f; font-size: 12px; padding: 4px; border-radius: 4px;',
        `[✔] @capacitor-community/safe-area is perfectly installed (svh: 720 mode enabled).`
      );
    }
  }  
  public async pxInfo(): Promise<{ pxPerCm:number }>{
    let _modelName  = '';
    let _pxPerCm:number  = 0;
    try {
      // 💡 修正ポイント①: iOS/Androidに関わらず、まず一番最初に共通で型番を取得します
      ({ modelName: _modelName } = await this.deviceSvc.infoVer());
    } catch (e) {
      console.error('型番の取得に失敗しました:', e);
      _modelName = '';
    }
    if (this.platform.is('ios')) {
      // 💡 ①【62px】縦932pt超グループ: 最新のベゼルレス特大高密度画面
      if (
        _modelName.includes('iPhone17,4') || // iPhone 16 Pro Max
        _modelName.includes('iPhone16,2') || // iPhone 15 Pro Max
        _modelName.includes('iPhone15,3')    // iPhone 14 Pro Max
      ) {
        _pxPerCm = 62;
      }
      // 💡 ②【61px】縦932pt / 896pt / 736pt グループ: 歴代の「Plus / 大画面」シリーズ
      // あなたのiPhone 8 Plusでの実証、および16 Plusとの「3倍高密度（@3x）共通密度」の論理に基づき、
      // 414ポイントの歴史的規格を持つ大画面端末を一括統合します！
      else if (
        _modelName.includes('iPhone16,1') || // iPhone 15 Plus
        _modelName.includes('iPhone15,5') || // iPhone 15 Plus (別型番)
        _modelName.includes('iPhone14,3') || // iPhone 13 Pro Max
        _modelName.includes('iPhone13,4') || // iPhone 12 Pro Max
        _modelName.includes('iPhone11,8') || // iPhone XR (液晶ですが倍率補正で61px相当)
        _modelName.includes('iPhone12,5') || // iPhone 11 Pro Max
        _modelName.includes('iPhone10,2') || // iPhone 8 Plus (開発機実測値)
        _modelName.includes('iPhone10,5')    // iPhone 8 Plus (開発機別型番)
      ) {
        _pxPerCm = 61;
      }
      // 💡 ③【60px】縦852pt（Pro仕様）グループ: 16 Proなどのベゼルレス標準高密度画面
      else if (
        _modelName.includes('iPhone17,1') || // iPhone 16 Pro
        _modelName.includes('iPhone17,2') || // iPhone 17 (無印想定)
        _modelName.includes('iPhone17,3')    // iPhone 17 Slim想定
      ) {
        _pxPerCm = 60;
      }
      // 💡 ④【57px】縦852pt / 844pt / 812pt グループ: 歴代の「標準サイズ（6.1インチ）」シリーズ
      else if (
        _modelName.includes('iPhone16,5') || // iPhone 16 (無印)
        _modelName.includes('iPhone15,4') || // iPhone 15 (無印)
        _modelName.includes('iPhone14,5') || // iPhone 13 (無印)
        _modelName.includes('iPhone13,2') || // iPhone 12 (無印)
        _modelName.includes('iPhone12,1') || // iPhone 11 (無印)
        _modelName.includes('iPhone11,2')    // iPhone XS / X
      ) {
        _pxPerCm = 57;
      }
      // 💡 ⑤【50px】縦667pt グループ: 歴代の4.7インチコンパクト液晶画面
      else if (
        _modelName.includes('iPhone12,8') || // iPhone SE (第2世代)
        _modelName.includes('iPhone14,6') || // iPhone SE (第3世代)
        _modelName.includes('iPhone10,1') || // iPhone 8 (無印)
        _modelName.includes('iPhone10,4')    // iPhone 8 (無印別型番)
      ) {
        _pxPerCm = 50;
      }
      // 💡 ⑥ 未知の新型iPhoneやiPad、iPod touchなどが検出された場合の安全なデフォルト値
      else {
        _pxPerCm = 57;
      }
    } else {
      if (_modelName.includes('SO-05K')) {
        _pxPerCm = 64;
      } else {
        _pxPerCm = 60; 
      }      
    }
    return {pxPerCm: _pxPerCm };
  }
  public getAdInfo() : {adIdBanner:string, adIdReward:string, isUseDemoId:boolean, adIdProduct:string}{
    const _isUseDemoId    = this.adSvc.adTestModeCur();
    const _adIdBannerCur  = this.adSvc.adIdBannerCur();
    const _adIdProduct    = this.adSvc.adIdBannerProduct();
    const _adIdRewardCur  = this.adSvc.adIdRewardCur();
    return {adIdBanner:_adIdBannerCur, adIdReward:_adIdRewardCur, isUseDemoId:_isUseDemoId, adIdProduct:_adIdProduct }
  }
  private async getOrientation(): Promise<void> {
    await this.platform.ready();
    console.log('[Window]Platform is ready!');
    this.isTablet     = this.platform.is('tablet'); 
    const orientation = await ScreenOrientation.orientation();    
    this.isPortrait   = orientation.type.startsWith('portrait');
    //----
    this.updateCssOrientation(this.isPortrait);
    this.adBannerHeight = this.isPortrait ? this._adBannerHeightPortraitInit : this._adBannerHeightLandscapeInit;
    this.updateLayout(this.adBannerHeight);
    console.log('[Window]Dist:layoutChanged');
    this.layoutChanged$.next();
    console.log('[Window]getOrientation:po',this._adBannerHeightPortraitInit,'la',this._adBannerHeightLandscapeInit,this.isPortrait)
    //----
    this.orientationListener = await ScreenOrientation.addListener(
      'screenOrientationChange', 
      (result) => {
        this.currentOrientation = result.type;
        console.log('[Window]Listen at ScreenOrientation',result.type)
        const isPortraitNow     = result.type.startsWith('portrait');
        if (isPortraitNow !== this.isPortrait ) {
          this.isPortrait = isPortraitNow;
          this.updateCssOrientation(this.isPortrait);
          this.updateLayout(this.estimateAdBannerHeight());
          console.log('[Window]Dist:layoutChanged');
          this.layoutChanged$.next();
          console.log('[Window]Dist:orientationOnly');
          this.orientationOnly$.next(this.isPortrait);          
        } else {
          console.log(`[Window][画面回転スキップ] 上下または左右の反転のため、イベント発行をブロックしました: ${result.type}`);
          this.isPortrait = isPortraitNow;
        }
      }
    );
  }
  private updateCssOrientation( _isPortrait:boolean){
    let _pickerWidth:number   = 100;
    if (this.isTablet ){
      _pickerWidth  = 50;
    } else {
      _pickerWidth = _isPortrait ? 100 : 50;
    }
    document.documentElement.style.setProperty(
      '--pickerWidth', 
      `${_pickerWidth}`
    );
    console.log(`[Window][CSS変数注入] --pickerWidth: ${_pickerWidth}`);
  }
  public isPageActive(_pageInstance:any): boolean {
    if (!_pageInstance?.constructor) return false;
    const selector = (_pageInstance.constructor as any).ɵcmp?.selectors?.[0]?.[0];
    if (!selector) {
      console.error('[Window][isPageActive警告] セレクター名を取得できませんでした');
      return false;
    }
    // 確実な offsetHeight 判定を実行
    const element = document.querySelector(selector) as HTMLElement;
    return element ? element.offsetHeight > 0 : false;
  }
  public updateLayout(_adBannerHeight:number){
    console.log('[Window]updateLayout(adBannerHeight',_adBannerHeight);
    ({svh:this.svh, svw:this.svw} = this.getSVViewportInPixels());
    this.adBannerHeight                               = _adBannerHeight;
    if (_adBannerHeight > 0){
      if (this.isPortrait){
        this._adBannerHeightPortraitInit              = _adBannerHeight;
        localStorage['_adBannerHeightPortraitInit']   = JSON.stringify(this._adBannerHeightPortraitInit);
      } else {
        this._adBannerHeightLandscapeInit             = _adBannerHeight;
        localStorage['_adBannerHeightLandscapeInit']  = JSON.stringify(this._adBannerHeightLandscapeInit);
      }
    }
    this.updateCssPadding(_adBannerHeight);
  }
  private updateCssPadding(_adBannerHeight:number){
    const nativeValues        = this.getSafeAreaValuesNative();
    this.safeAreaBottom       = nativeValues.bottom;
    const androidVersion = this.deviceSvc.infoVer().androidVersion;
    if (this.platform.is('android') && androidVersion < 15) {
      this.navigationBarHeight  = nativeValues.bottom;  //for Android
    } else {
      this.navigationBarHeight  = 0;
    }
    const _addPadding         = _adBannerHeight > 0 ? 5 : 0;  //バナーとタブバーの間のpaddingを足す
    const _padding            = _adBannerHeight + this.safeAreaBottom +  _addPadding;
    const _pickerHeight       =  this.isTablet ? 256 :   200 + 56 + _padding;
    if (this.cssPaddingBottomCurr != _padding){
      this.cssPaddingBottomCurr   = _padding;
      document.documentElement.style.setProperty(
        '--tabBarPaddingBottom', 
        `${_padding}px`
      );
      console.log(`[Window][CSS変数注入] --tabBarPaddingBottom: ${_padding}px`);
      document.documentElement.style.setProperty(
        '--pickerHeight', 
        `${_pickerHeight}px`
      );
      console.log(`[Window][CSS変数注入] --pickerHeight: ${_pickerHeight}px`);
      this.layoutChanged$.next();
    }
  }
  private getSafeAreaValuesNative(): { top: number, bottom: number } {
    let _top    = 0;
    let _bottom = 0;
    // 1. iOS（iPhone）の場合は、Apple公式の正確な固定値をベースにする
    if (this.platform.is('ios') ) {
      if (this.isExistSafeAreaIOS()) {
        if (this.isPortrait) {
          _top    = WindowService.SAFEAREA_TOP_P_IOS; // 47px
          _bottom = WindowService.SAFEAREA_BTM_P_IOS; // 34px
        } else {
          _top    = WindowService.SAFEAREA_TOP_L_IOS; //  0px
          _bottom = WindowService.SAFEAREA_BTM_L_IOS; // 21px
        }
      }
      return { top: _top, bottom: _bottom };
    }
    if (this.platform.is('android')) {
      const androidVersion = this.deviceSvc.infoVer().androidVersion;
      if (androidVersion >= 15) {
        _top    = 0;
        try {
          const computedStyle = window.getComputedStyle(document.documentElement);
          const cssBottomVal  = computedStyle.getPropertyValue('--safe-area-inset-bottom') || '';
          _bottom             = parseInt(cssBottomVal, 10) || 0;
        } catch (e) {
          // パース失敗時や未定義時の安全なフォールバック値（Android 15の標準的なナビゲーションバー高目安）
          _bottom = 24; 
        }
      } else {
        if (this.isPortrait) {
          _top    = WindowService.SAFEAREA_TOP_P_AND;   // 24px
          const isSmallScreen = window.matchMedia('(max-height: 640px)').matches;
          if (isSmallScreen) {
            _bottom = WindowService.SAFEAREA_BTM_P_AND_OLD; // 40px
          } else {
            _bottom = WindowService.SAFEAREA_BTM_P_AND;     // 48px
          }
        } else {
          _top    = 0;
          _bottom = 0;  // 横向き時はバーが横に移動するため下部は 0px になります
        }
      }
      return { top: _top, bottom: _bottom };
    }
    // PCブラウザ環境などのフォールバック
    return { top: 0, bottom: 0 };
  }
  private isExistSafeAreaIOS() : boolean {
    if (!this.platform.is('ios')) return false;
    /* ==========================================================================
       🔥 【物理サイズによるノッチ・ホームバー搭載機の完全一本釣り 🎯】
       ・iPhone 8 以前や 8 Plus などの旧機種（セーフエリアなし） ➔ 画面の最大長は「 736px 以下 」です。
       ・iPhone X 〜 16、およびそれ以降の最新機種（セーフエリアあり）➔ 画面の最大長は「 812px 以上 」になります。
       
       この画面の長さが「800ピクセルを越えているか」という厳然たる物理事実を見ることで、
       iOSからのCSS変数の注入遅延に【100%左右されず】、起動直後から完璧にセーフエリアの有無を検知できます！
       ========================================================================== */
    const isLongDevice = window.matchMedia('(min-width: 800px) or (min-height: 800px)').matches;    
    return isLongDevice;
  }
  public getSelectorHeight(_selector:string){
    const   _ionSelector  = document.querySelector(_selector);
    return  _ionSelector ? _ionSelector.getBoundingClientRect().height : 0;
  }
  public getHeaderAreaHeight(_id:string){

    const headerHeight  = this.getSelectorHeight(_id + ' ion-header');
    if (headerHeight > 0){
      this._headerHeightInit            = headerHeight;
      localStorage['_headerHeightInit'] = JSON.stringify(this._headerHeightInit);
    }
    return this._headerHeightInit;
  }
  public getTabAreaHeightDebug() {
    let tabBarHeight = 0;
    console.log('[Window]=== 🔍 [DOM生体スキャンテスト開始] ===');

    // 1. 【大元の親】ion-tabs の生存確認
    const tabsParent = document.querySelector('ion-tabs');
    if (tabsParent) {
      const parentRect = tabsParent.getBoundingClientRect();
      console.log(`[Window]🟢 [1] ion-tabs 発見! 高さ: ${parentRect.height}px, 幅: ${parentRect.width}px`);
    } else {
      console.error('[Window]❌ [1] ion-tabs がHTML上に存在しません（大元の親が消失）');
    }
    // 2. 【枠組み】ion-tab-bar の生存確認（既存の拡張）
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      const barRect = tabBar.getBoundingClientRect();
      tabBarHeight = barRect.height;
      console.log(`[Window]🟢 [2] ion-tab-bar 発見! 高さ: ${tabBarHeight}px, 幅: ${barRect.width}px`);
      
      // 3. 【中身の子】ion-tab-button（ボタンたち）がHTML上にあるかスキャン
      const buttons = tabBar.querySelectorAll('ion-tab-button');
      console.log(`[Window]📊 [3] 見つかったボタンの数: ${buttons.length}個`);
      
      buttons.forEach((btn, index) => {
        const btnRect = btn.getBoundingClientRect();
        const tabAttr = btn.getAttribute('tab') || 'unknown';
        console.log(`[Window]   └ ボタン[${index}] (${tabAttr}): 高さ: ${btnRect.height}px, 幅: ${btnRect.width}px`);
        
        // 4. 【孫要素】文字とアイコンのサイズをピンポイント測定
        const icon = btn.querySelector('ion-icon');
        const label = btn.querySelector('ion-label');
        
        const iconHeight = icon ? icon.getBoundingClientRect().height : 'なし';
        const labelHeight = label ? label.getBoundingClientRect().height : 'なし';
        console.log(`[Window]      └ アイコン高: ${iconHeight}px / 文字高: ${labelHeight}px`);
      });

    } else {
      console.error('[Window]❌ [2] ion-tab-bar が見つかりません');
    }
    console.log('[Window]=== 🔍 [DOM生体スキャンテスト終了] ===');
    return tabBarHeight;
  }
  public getTabAreaHeight(){
    let tabBarHeight = 0;

    // 1. 画面上の ion-tab-bar 要素を探して高さを取得する
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      tabBarHeight = tabBar.getBoundingClientRect().height;
    } else {
      console.log('[Window]not found:ion-tab-bar')
    }
    return tabBarHeight;
  }
  public estimateAdBannerHeight(){
    let _estimateHeight = 0;
    if (this.isPortrait){
      _estimateHeight = this._adBannerHeightPortraitInit;
    } else {
      _estimateHeight = this._adBannerHeightLandscapeInit;
    }
    if (_estimateHeight == 0){
      _estimateHeight = this.adBannerHeight;
    }
    console.log('[Window]estimateAdBannerHeight:',_estimateHeight,'px portlait:',this._adBannerHeightPortraitInit,'landscape:',this._adBannerHeightLandscapeInit,this.isPortrait)
    return _estimateHeight;
  }
  public getElementAreaSize(_element:ElementRef): {width:number, height:number}{
    let _width = 0;
    let _height = 0;
    if (_element && _element.nativeElement) {
      const el = _element.nativeElement;
      const rect = el.getBoundingClientRect();
      _width = rect.width;
      _height = rect.height;
    }
    return {width: _width, height:_height};
  }
  private getSVViewportInPixels(): { svh: number, svw: number } {
    const div = document.createElement('div');
    div.style.height      = '100svh';
    div.style.width       = '100svw';
    div.style.position    = 'fixed';
    div.style.visibility  = 'hidden';
    document.body.appendChild(div);
  
    const svhPx = div.clientHeight;
    const svwPx = div.clientWidth;
    document.body.removeChild(div);
    return { svh:svhPx, svw:svwPx};
  }
  //===========================================================================
  public async showAdReward(){
    let isTriggered:boolean = false;
    if (this.isAppWithAd){
      isTriggered = await this.adSvc.showAdReward(this);
    }
    return isTriggered;
  }
  public reqCancelShowAdReward(){
    this.adSvc.reqCancelShowAdReward();
  }
  public execAdRewardGrant() : number{    
    //広告報酬獲得
    let _nextChenckSec = APP_CONFIG.ADREWARD_DURATION_MIN * 60;
    if (this.isAppWithAd){
      if (this.adSvc.isInitialized()){
        this.adBannerHeight               = 0;
        this._adBannerHeightPortraitInit  = 0;
        this._adBannerHeightLandscapeInit = 0;
        localStorage['_adBannerHeightPortraitInit']   = JSON.stringify(this._adBannerHeightPortraitInit);
        localStorage['_adBannerHeightLandscapeInit']  = JSON.stringify(this._adBannerHeightLandscapeInit);
        this.adSvc.unloadAdBanner(this);
      }
      _nextChenckSec = Math.ceil((this._adRewardExpireDate - Date.now() ) /1000);  
      if (_nextChenckSec <= 0){
        _nextChenckSec = 5;
      }
    }
    return _nextChenckSec;
  }
  public setExpireTime(){
    console.log('🎉 [Window]動画完全視聴を確認！「',APP_CONFIG.ADREWARD_DURATION_MIN,'分間の広告非表示権」を発動します！');
    const baseDate = new Date();
    baseDate.setSeconds(0, 0);
    this._adRewardExpireDate = baseDate.getTime() + APP_CONFIG.ADREWARD_DURATION_MIN * 60 * 1000;
    localStorage['_adRewardExpireDate'] = JSON.stringify(this._adRewardExpireDate);
  }
  public getExpireTime(){
    return this._adRewardExpireDate;
  }
  public async expireAdRewardGrant(){
    //広告報酬期限切れ
    localStorage.removeItem('_adRewardExpireDate'); // 引き出しをお掃除
    this._adRewardExpireDate = 0;
    // もし一度も動画を見ていない、または期限の引き出しが空っぽなら通常通りバナーを即射出！
    if (this.isAppWithAd){
      await this.adSvc.loadAdBanner(this);
    }
  }
  //===========================================================================
  public async hideAdBannerByModal(){
    if (this.isAppWithAd){
      console.log('[Window]hideAdBannerByModal()')
      this.isModalNowVisible            = true;

      await this.adSvc.requestHideAdBanner();
    }
  }
  public async resumeAdBannerByModal(){
    if (this.isAppWithAd){
      console.log('[Window]resumeAdBannerByModal()')
      this.isModalNowVisible            = false;
      if ( this._isAllowResumeAdBanner() ){
        await this.adSvc.allowResumeAdBanner(this);
      }
    }
  }
  private _isAllowResumeAdBanner(){
    return !this.isKeyboardNowVisible && !this.isModalNowVisible;
  }
  //===========================================================================
  public async hideAdBannerByKeyboard(){
    if (this.isAppWithAd){
      console.log('[Window]hideAdBannerByKeyboard()')
      this.isKeyboardNowVisible            = true;

      await this.adSvc.requestHideAdBanner();
    }
  }
  public async resumeAdBannerByKeyboard(){
    if (this.isAppWithAd){
      console.log('[Window]resumeAdBannerByKeyboard()')
      this.isKeyboardNowVisible            = false;
      if ( this._isAllowResumeAdBanner() ){
        await this.adSvc.allowResumeAdBanner(this);
      }
    }
  }

  private initializeKeyboard(_capacitor_getPlatform:string){
    if (_capacitor_getPlatform === 'ios' ){
      this._addAccessaryBarOnKeyboard();
      this._fobiddenUndoPopup();
      this._initKeyboardListener(_capacitor_getPlatform);
    } else if (_capacitor_getPlatform === 'android') {
      // 🤖 Android用のブラウザ標準ビューポート監視を起動
      this._initKeyboardListenerAndroid();
    }
  }
  private _addAccessaryBarOnKeyboard(){
    //iPhoneやiPad（iOS実機）において、文字入力時に画面下からキーボードが
    // ニュッとせり上がってきた際、キーボードの真上にある『完了（Done）』や
    // 『矢印（◀ ▶）』が並んだグレーの便利な補助バー（アクセサリバー）を、
    // 液晶画面に100%確実に強制表示させなさい」**というiOS専用の入力補助インフラ処理です。
    Keyboard.setAccessoryBarVisible({ isVisible: true })
      .catch(err => console.error('[Window]Keyboard plugin not available on web', err));
  }
  private _fobiddenUndoPopup(){
    try {
      // ※Capacitor Keyboardプラグインの構成やOS設定を直撃し、
      // 入力フォーム上でのOS独自のフライング割り込み動作を根元から125%シャットアウトします。
      // （実務的には、WebView内のWeb標準イベントで以下のように「 undo 」命令を完全に殺すのが最も安全です）
      document.addEventListener('undo', (e) => {
        e.preventDefault(); // 🍏 OSの「元に戻す」の動作を力任せに完全キャンセル！
      }, { passive: false });
      
      console.log('🧹 [Window] iOS特有のシェイクUndoポップアップの完全無効化・施錠に成功しました！');
    } catch (error) {
      console.error('⚠️ 設定エラー:', error);
    }
  }
  private _initKeyboardListener(_capacitor_getPlatform:string){
    //「アプリが起動したまさにその最初の数ミリ秒の間は、スマートフォンのネイティブシステム（OS層）や
    // Capacitorのプラグイン回路自体がまだ『完全に目覚めきっておらず更地の状態』であるため、
    // 最速のミリ秒精度でリスナーの配線を繋ごうとすると、電子レベルですれ違って登録に失敗（無視）されてしまう
    // 『起動直後のサイレント不発バグ』を100%確実に回避（防衛）するため」
    if (_capacitor_getPlatform === 'ios') {
      setTimeout(() => {
        this._initKeyboardListenersIOS();
      }, 1000); // 1秒待ってから確実にリスナーを登録する
    }
    //Android版
    //capacitor.config.ts　に以下の記述を入れ、キーボードOPENでの画面リサイズを止める。
    //でないと、キーボードのOpen/Close後に向きを変えた時の
    // キーボードのOpen/Closeでタブバーが消える不具合が発生する。
    //
    //const config: CapacitorConfig = {
    //  plugins: {
    //    Keyboard: {
    //      resize: KeyboardResize.None,  ←IOS用
    //      resizeOnFullScreen: true      ←Android用
    //    }
    //
  }
  private async _initKeyboardListenersIOS(){
    this.keyboardShowListener = await Keyboard.addListener('keyboardWillShow', async () => {
      console.log('[Window]listen:keyboardWillShow')
      document.body.classList.add('keyboard-is-open');
      this.isKeyboardNowVisible         = true;
      await this.adSvc.requestHideAdBanner();
    });
    this.keyboardHideListener = await Keyboard.addListener('keyboardWillHide', async () => {
      console.log('[Window]listen:keyboardWillHide')
      this.handleKeyboardCloseWithDelay();
    });
  }
  private _initKeyboardListenerAndroid() {
    if (!window.visualViewport) return;
    // 画面が起動した瞬間の初期の縦幅を保持
    const initialHeight = window.innerHeight;

    window.visualViewport.addEventListener('resize', async () => {
      const currentViewportHeight = window.visualViewport!.height;

      // 画面の初期高さから、現在の表示領域が150px以上縮んだら「キーボード表示」と判定
      // (ナビゲーションバーの微小なサイズ変化による誤検知を防ぐための安全マージン)
      const isKeyboardOpen = (initialHeight - currentViewportHeight) > 150;
      // 状態に変化があった場合のみ処理を実行（多重発火の防止）
      if (this.isKeyboardNowVisible !== isKeyboardOpen) {
        if (isKeyboardOpen) {
          console.log('[Window] Android: キーボード上昇を検出しました');
          // 既存の広告非表示メソッドをそのまま叩く
          await this.hideAdBannerByKeyboard();
        } else {
          console.log('[Window] Android: キーボード降下を検出しました');
          
          // iOS側の実装（handleKeyboardCloseWithDelay）と同様に、
          // キーボードが引っ込むネイティブアニメーションの完了を少し待ってからバナーを復元する
          setTimeout(async () => {
            await this.resumeAdBannerByKeyboard();
          }, 300);
        }
      }
    });
  }
  private handleKeyboardCloseWithDelay() {
    this.isKeyboardNowVisible             = false;
    setTimeout(async () => {
      document.body.classList.remove('keyboard-is-open');
      if ( this._isAllowResumeAdBanner() ){
        await this.adSvc.allowResumeAdBanner(this);
        console.log('[Window]Banner resumed after keyboard hide');
      }
    }, 300);
  }
  //===========================================================================
}
