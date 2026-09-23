import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL,CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Platform } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class BillingService {

  public  isPremiumUser: boolean = false;
  private restoredInfo:any      = null;
  public  customerInfo:any      = null;
  private _capacitor_getPlatform:string   = '';
  //---
  private static readonly APIKEY_IOS:string   = 'appl_amdiOXQdNuRAJyZZlaLkgotAyDC';
  private static readonly APIKEY_AND:string   = 'test_mrwSCsxvzsOBinfSohjBnyMGefp';
  private static readonly APIKEY_WEB:string   = 'test_mrwSCsxvzsOBinfSohjBnyMGefp';
  //===========================================================================
  constructor(
    private platform: Platform
  ) {
    this._capacitor_getPlatform = Capacitor.getPlatform();
  }
  //===========================================================================
  public async initialize( _entitlements:string[]){
    if (this._capacitor_getPlatform === 'web'){
      return;
    }
    await this.platform.ready();
    this.customerInfo = await this.getCustomerInfo(_entitlements);
  }
  //===========================================================================
  public async getCustomerInfo( _entitlements:string[]): Promise<CustomerInfo | null>{

    if (this._capacitor_getPlatform === 'web'){
      return null;
    }
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    if (this.platform.is('ios')) {
      await Purchases.configure({ apiKey:BillingService.APIKEY_IOS});
    } else if (this.platform.is('android')) {
      await Purchases.configure({ apiKey:BillingService.APIKEY_AND});
    } else {
      await Purchases.configure({ apiKey:BillingService.APIKEY_WEB}); 
    }
    try {
      const { customerInfo }: { customerInfo: CustomerInfo } = await Purchases.getCustomerInfo();
      let _hasAnyEntitlement:boolean  = false;
      for ( let _e of _entitlements){
        if ( customerInfo.entitlements.active[_e]){
          _hasAnyEntitlement = true;
          break;
        }
      }
      if (_hasAnyEntitlement){
        this.isPremiumUser = true;
        console.log('[Billing] すでに何らかの有料プラン（資格）が有効な状態です。');
        return customerInfo;
      } else {
        console.log('[Billing]過去の古いレシートをAppleサーバーから探しにいきます...');
        const restoredInfo = await this.restoreCustomerInfo(_entitlements);
        return restoredInfo;
      }
    } catch (e) {
      console.error('[Billing]レシートの復元中にエラーが発生しました（実機のSandbox環境以外では失敗する場合があります）', e);
      return null;
    }
  }
  //===========================================================================
  private async restoreCustomerInfo( _entitlements:string[]): Promise<CustomerInfo | null>{
    let _hasAnyEntitlement:boolean  = false;
    try {
      const { customerInfo: restoredInfo }: { customerInfo: CustomerInfo } = await Purchases.restorePurchases();
      for ( let _e of _entitlements){
        if ( restoredInfo.entitlements.active[_e]){
          _hasAnyEntitlement = true;
          break;
        }
      }
      if (_hasAnyEntitlement) {
        this.isPremiumUser = true;
        console.log('[Billing] 過去の購入履歴からの自動復元に成功しました！');
      }
      return restoredInfo;

    } catch (e) {
      console.error('[Billing]レシートの復元中にエラーが発生しました（実機のSandbox環境以外では失敗する場合があります）', e);
      return null;
    } 
  }
  //===========================================================================
  public async clickRestore(): Promise<void> {

    if (this._capacitor_getPlatform === 'web'){
      return;
    }

    // ① Appleサーバーから過去の全レシート（2013年の明細）を強制回収します
    const restoredInfo = await this.syncPastPurchasesAndGetInfo(); 

    if (this.isPremiumUser) {
      alert('プレミアム機能（複数年分析など）が正常に復元されました！');
    } else {
      alert('過去の購入履歴が見つかりませんでした。再度Sandboxサインインを確認してください。');
    }
    // ② 【最重要】レシートの中から、Appleが返してきた「本物のプロダクトID」の配列を引っこ抜きます
    const purchasedIds = restoredInfo.customerInfo.allPurchasedProductIdentifiers;
    
    // ③ ログと画面のアラートで、その正体を暴露します
    console.log('[UpgradePage]','★発見した過去のプロダクトIDの一覧はこれです：', purchasedIds);
    
    if (purchasedIds && purchasedIds.length > 0) {
      // 🍏 画面に「[com.beetre.realestate.premium] が見つかりました！」とダイレクトに表示させます
      alert('発見した過去のプロダクトID:\n' + JSON.stringify(purchasedIds));
    } else {
      alert('レシートの解析に成功しましたが、購入履歴（Product ID）が空っぽです。');
    }
  }
  //===========================================================================
  public async getUpgradePackages(targetRevenueName:string){

    if (this._capacitor_getPlatform === 'web'){
      return [];
    }
    const targetOfferingId:string = 'offering_' + targetRevenueName;
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.all[targetOfferingId];        
      if (currentOffering) {
        return currentOffering.availablePackages;
      }
      return [];

    } catch (e) {
      console.error('[Billing]プランの取得に失敗しました', e);
      return [];
    }
  }
  //===========================================================================
  public async purchasePackage(rcPackage: any): Promise<boolean> {
    if (this._capacitor_getPlatform === 'web'){
      return false;
    }
    try {
      // ユーザーが選択したパッケージ（月額など）を指定して購入を実行
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
      
      // 購入成功後の最新状態をチェック
      this.isPremiumUser = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
      return this.isPremiumUser;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[Billing]ユーザーが購入をキャンセルしました');
      } else {
        console.error('[Billing]購入エラーが発生しました:', error);
      }
      return false;
    }
  }
  public isActiveFeattures( _features:string){
    if (this._capacitor_getPlatform === 'web'){
      return '';
    } else {
      return this.customerInfo.entitlements.active[_features];
    }
  }
  //===========================================================================
  //===========================================================================
  public getRestoredInfo(){
    return this.restoredInfo;
  }
  //===========================================================================
  //===========================================================================
  //===========================================================================
  //===========================================================================
  private async initRevenueCat() {
    await this.platform.ready();
    
    // 開発中はデバッグログを有効にしておくと調査が捗ります
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

    // Apple / Google から発行された RevenueCat 用の API キーを設定
    if (this.platform.is('ios')) {
      await Purchases.configure({ apiKey:BillingService.APIKEY_IOS});
    } else if (this.platform.is('android')) {
      await Purchases.configure({ apiKey:BillingService.APIKEY_AND});
    } else {
      await Purchases.configure({ apiKey:BillingService.APIKEY_WEB}); 
    }
    this.restoredInfo = await this.syncPastPurchasesAndGetInfo();
    console.log(this.restoredInfo);
  }
  public async syncPastPurchasesAndGetInfo(): Promise<any> {

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      if (typeof customerInfo.customerInfo.entitlements.active['premium'] === 'undefined') {
        console.log('[Billing]過去の古いレシートをAppleサーバーから探しにいきます...');
        
        // 先ほど配信国を復活させたため、Appleは正常な承認を返し、履歴が自動でRevenueCatへ同期されます
        const _restoredInfo = await Purchases.restorePurchases();
        return _restoredInfo;         
      } else {
        this.isPremiumUser = true;
        console.log('[Billing]すでにプレミアム権利が有効な状態です。');
        return customerInfo;
      }
    } catch (e) {
      console.error('[Billing]レシートの復元中にエラーが発生しました（実機のSandbox環境以外では失敗する場合があります）', e);
      return null;
    }
  }
  public async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.isPremiumUser = typeof customerInfo.customerInfo.entitlements.active['premium'] !== 'undefined';
      return this.isPremiumUser;
    } catch (e) {
      console.error('[Billing]復元に失敗しました', e);
      return false;
    }
  }
  public async purchasePremium(): Promise<boolean> {
    try {
      console.log('[Billing] 料金プランの取得を開始します...');
      // ① RevenueCatの管理画面で設定した「Default Offering」のセットを取得します
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null && offerings.current.lifetime !== null) {
        // ② Lifetime（買い切り）パッケージを狙い撃ちして購入を実行します
        const rcPackage = offerings.current.lifetime;
        console.log('[Billing] 決済処理をAppleサーバーへ送信します:', rcPackage.product.identifier);
        
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
        
        // ③ 購入完了後、プレミアムの権利（premium）が有効になったか判定します
        this.isPremiumUser = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
        return this.isPremiumUser;
      } else {
        console.warn('[Billing] RevenueCat側でDefault OfferingのLifetimeが設定されていません。');
        return false;
      }
    } catch (error: any) {
      // ユーザーが購入ポップアップの「キャンセル」を押した場合のハンドリング
      if (error.userCancelled) {
        console.log('[Billing] ユーザーが購入をキャンセルしました。');
      } else {
        console.error('[Billing] 購入処理中に予期せぬエラーが発生しました:', error);
      }
      return false;
    }
  }
  public async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages; // ['月額プラン', '年額プラン' など]
      }
      return [];
    } catch (e) {
      console.error('[Billing]プランの取得に失敗しました', e);
      return [];
    }
  }

  //===========================================================================
}
