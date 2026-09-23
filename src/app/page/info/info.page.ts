import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonGrid, IonRow, IonCol, IonLabel, IonTextarea, IonIcon, IonList, IonItemOptions, IonItemOption, IonItemSliding, IonButtons, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarNumberOutline, calendarOutline, timeOutline, trash } from 'ionicons/icons';
//---
import { APP_CONFIG } from 'src/app/config/app.constants';
import { DEF } from 'src/app/config/default-constants';
import { Num, Str } from 'src/app/utils/util';
import { AppmodeService } from 'src/app/service/features/appmode-service';
import { AlertService } from 'src/app/service/infra/alert-service';
import { DateService } from 'src/app/service/infra/date-service';
import { DebugService } from 'src/app/service/infra/debug-service';
import { DeviceService } from 'src/app/service/infra/device-service';
import { InputService } from 'src/app/service/infra/input-service';
import { WindowService } from 'src/app/service/infra/window-service';
//---
import { AlcToleranceLevel, GenderType, IBlood, IBody } from 'src/app/interface/health';
import { DrinkService } from 'src/app/service/features/drink-service';
import { MenuService } from 'src/app/service/features/menu-service';
import { PartyService } from 'src/app/service/features/party-service';
import { HealthService } from 'src/app/service/features/health-service';
import { DebugComponent } from 'src/app/components/debug/debug.component';
//---
import { InlineDatetimeComponent } from 'src/app/components/inline-datetime/inline-datetime.component';
import { NumericInputComponent } from 'src/app/components/numeric-input/numeric-input.component';
import { TipsItemComponent } from "src/app/components/tips-item/tips-item.component";
import { SharedModalComponent } from 'src/app/components/shared-modal/shared-modal.component';
//---
@Component({
  selector: 'app-info',
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
  standalone: true,
  imports: [IonItemSliding, IonItemOption, IonItemOptions, IonList, IonIcon, IonTextarea, IonCol, IonRow, IonGrid, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, CommonModule, FormsModule, IonLabel, IonItemSliding, DebugComponent, NumericInputComponent, SharedModalComponent, TipsItemComponent, InlineDatetimeComponent]
})
export class InfoPage implements OnInit {

  @ViewChild('slidingListWeight') slidingListWeight!: HTMLIonListElement;
  @ViewChild('slidingListGgtp')   slidingListGgtp!: HTMLIonListElement;

  public  version:string                  = '';
  public  build:string                    = '';
  public  info:string                     = "ビア＋＋は飲み過ぎ防止のため、手軽にアルコール摂取量をカウントするアプリです。\n\n体重・体脂肪率を入れるとアルコール血中濃度を予測できます。";
  public  isLoaded: boolean               = false;
  public  isDispBody:boolean              = true;
  public  isOpenAlcTolerance:boolean      = false;
  public  weight:number                   = DEF.WEIGHT;
  public  fatRate100:number               = DEF.FATRATE *100;
  public  gender: GenderType              = DEF.GENDER;
  public  ggtp:number                     = 30;
  public  astgot:number                   = 30;
  public  altgpt:number                   = 30;

  public  isOpenAdReward:boolean          = false;
  public  isErrorAdReward:boolean         = false;
  //---
  public  isOpenWeight:boolean            = false;
  public  isOpenGgtp:boolean              = false;
  public  utcDateCurr:Date                = new Date();
  public  isDatetimeRendered: boolean     = true;
  public  tipsWeight:string               = '体重・体脂肪率を使ってアルコール血中濃度を計算します。';
  public  tipsGgtp:string                 = 'アルコールの飲み過ぎで肝機能の数値は悪化します。\nこのアプリではメモするだけで計算には使いませんが、これらの数値は意識するようにしましょう。\n\nγ-GTP\n　51〜100 U/L：軽度高値\n　100〜200 U/L：中等度高値\n　200 U/L以上：高度高値\n\nAST・ALT\n　30以下：基準\n　31〜50：要注意\n　51以上：異常\n';
  public  alcTolLevel:AlcToleranceLevel   = 'normal';
  constructor(
    private cdr: ChangeDetectorRef,
    private drinkSvc: DrinkService,
    private alertSvc: AlertService,
    private appmodeSvc: AppmodeService,
    private  dateSvc: DateService,
    private deviceSvc: DeviceService,
    private debugSvc: DebugService,
    private inputSvc: InputService,
    private healthSvc: HealthService,
    private menuSvc: MenuService,
    private partySvc: PartyService,
    private windowSvc: WindowService,
  ) {
    addIcons({calendarOutline,timeOutline,trash,calendarNumberOutline});    
  }
  async ngOnInit() {
    this.partySvc.readBackup();
    this.appmodeSvc.readBackup();
    this.initParam();
  }
  ionViewWillEnter(){
    this.partySvc.readBackup();
    ({version:this.version, build:this.build} =  this.deviceSvc.infoVer());
    this.menuSvc.menuLoaded$.subscribe((loaded: boolean) => {
      this.isLoaded = loaded;
      if (loaded) {
        this.initParam();
      }
    });
  }
  //===========================================================================
  public get modeName(): string {
    return this.appmodeSvc.getModeInfo().name;
  }
  public get isAdmin(): boolean {
    return this.debugSvc.isAdminDevice();
  }
  public get isAppWithAd() :boolean {
    return this.appmodeSvc.info().withAd;
  }
  public get strExpireDate() : string {
    const  _numExpireDate = this.windowSvc.getExpireTime();
    if (_numExpireDate == 0){
      return '広告を見ると一時的にバナーが消えます';
    } else {
      const dateText = new Date(_numExpireDate).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit'});
      return dateText + ' までバナーを消します'
    }
  }
  public async watchAd(){
    this.isErrorAdReward = false;
    let isTriggered:boolean = false;
    if (this.appmodeSvc.info().withAd){
      this.isOpenAdReward = true;
      console.log('広告を見る')
      isTriggered = await this.windowSvc.showAdReward();
      console.log('[InfoPage]isTriggered',isTriggered)
      if (isTriggered){
        this.isOpenAdReward = false;
      } else {
        this.isErrorAdReward = true;
      }
    }
  }
  public modalClosePreAdReward(){
    this.isOpenAdReward = false;
    this.windowSvc.reqCancelShowAdReward();
  }
  public get arrBodyInfo(): IBody[] {
    return this.healthSvc.arrBody;
  }
  public get arrBloodInfo(): IBlood[] {
    return this.healthSvc.arrBlood;
  }
  public strInfoDate( _isoDate:string): string {
    return this.dateSvc.isoToStrDate(_isoDate)
  }
  public strWeight( _body:IBody): string {
    return Str.float(_body.weight, APP_CONFIG.DEC_PLACE_DEF, APP_CONFIG.DEC_PLACE_DEF) + ' kg';
  }
  public strFatRate( _body:IBody): string {
    return Str.float(_body.fatRate*100, APP_CONFIG.DEC_PLACE_DEF, APP_CONFIG.DEC_PLACE_DEF) + '%' 
  }
  public colorGgtp(_val:number){
    return this.healthSvc.colorGgtp(_val);
  }
  public colorAst(_val:number){
    return this.healthSvc.colorAst(_val);
  }
  public colorAlt(_val:number){
    return this.healthSvc.colorAlt(_val);
  }
  public strGender(){
    if (this.gender === 'male'){
      return '男性';
    } else if (this.gender === 'female'){
      return '女性';
    } else {
      return 'その他';
    }
  }
  public strNameAlcoholTolerance(){
    return  this.healthSvc.alcToleranceInfo(this.alcTolLevel).name;
  }
  public strTipsAlcoholTolerance(){
    return  this.healthSvc.alcToleranceInfo(this.alcTolLevel).tips;
  }
  public arrAlcTolerance(){
    return HealthService.alcToleranceList;
  }
  public selectGender(_gender:GenderType){
    this.gender= _gender;
    this.drinkSvc.setBodyFactorInfo(this.gender,this.alcTolLevel);
  } 
  public selectAlcTol(_level:AlcToleranceLevel){
    this.alcTolLevel= _level;
    this.drinkSvc.setBodyFactorInfo(this.gender,this.alcTolLevel);
  } 
  //===========================================================================
  private initParam(){
    this.utcDateCurr  = new Date();
    const _nowTime    = this.dateSvc.utcDateToIso(this.utcDateCurr);
    //---
    const bodyInfo    = this.drinkSvc.bodyInfo( _nowTime);
    this.weight       = bodyInfo.weight;
    this.fatRate100   = Num.float(bodyInfo.fatRate * 100, APP_CONFIG.DEC_PLACE_DEF);
    //---
    const bloodInfo   = this.drinkSvc.bloodInfo( _nowTime);
    this.ggtp         = bloodInfo.ggtp;
    this.astgot       = bloodInfo.astgot;
    this.altgpt       = bloodInfo.altgpt;
    //---
    const bodyFactorInfo  = this.drinkSvc.bodyFactorInfo();
    this.gender       = bodyFactorInfo.gender;
    this.alcTolLevel  = bodyFactorInfo.alcToleranceLevel;
  }
  //===========================================================================
  public onIonInputBlur(ev:any, type:string, key:string){
    const value = ev.target!.value || '';;
    if (key === "weight"){
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type,this.weight,APP_CONFIG.WEIGHT_MAX,APP_CONFIG.DEC_PLACE_DEF);
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.weight          = retVal.updateNum;
      }
    } else if (key === "fatRate100"){
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type,this.fatRate100,APP_CONFIG.FATRATE_MAX*100,APP_CONFIG.DEC_PLACE_DEF);
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.fatRate100         = retVal.updateNum;
      }
    } else if (key === "ggtp"){
      const retVal      = this.inputSvc.readUpdatePosiInt( value, type,this.ggtp,APP_CONFIG.BLOODPRML_MAX);
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.ggtp      = retVal.updateNum;
      }
    } else if (key === "astgot"){
      const retVal      = this.inputSvc.readUpdatePosiInt( value, type,this.astgot,APP_CONFIG.BLOODPRML_MAX);
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.astgot      = retVal.updateNum;
      }
    } else if (key === "altgpt"){
      const retVal      = this.inputSvc.readUpdatePosiInt( value, type,this.altgpt,APP_CONFIG.BLOODPRML_MAX);
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.altgpt      = retVal.updateNum;
      }
    }
  }
  public changeDispBody(){
    this.isDispBody   = !this.isDispBody;
  }
  public modalOpen( key:string ){
    this.windowSvc.hideAdBannerByModal();
    if (key === 'weight'){
      this.isOpenWeight         = true;

    } else if (key === 'ggtp'){
      this.isOpenGgtp           = true;

    } else if (key === 'alcTolerance'){
      ({ gender:this.gender, alcToleranceLevel:this.alcTolLevel} = this.drinkSvc.bodyFactorInfo())
      this.isOpenAlcTolerance   = true;

    }
    this.cdr.detectChanges();  
  }
  public modalConfirm( isConfirm:boolean, key:string ){
    if (key === 'weight'){
      const _nowTime    = this.dateSvc.utcDateToIso(new Date());
      const bodyInfo    = this.drinkSvc.bodyInfo( _nowTime);
      this.weight       = bodyInfo.weight;
      this.fatRate100   = Num.float(bodyInfo.fatRate * 100, APP_CONFIG.DEC_PLACE_DEF);
      this.isOpenWeight         = false;

    } else if (key === 'ggtp'){
      const _nowTime    = this.dateSvc.utcDateToIso(new Date());
      const bloodInfo   = this.drinkSvc.bloodInfo( _nowTime);
      this.ggtp         = bloodInfo.ggtp;
      this.astgot       = bloodInfo.astgot;
      this.altgpt       = bloodInfo.altgpt;
      this.isOpenGgtp           = false;

    } else if (key === 'alcTolerance'){
      this.drinkSvc.setBodyFactorInfo(this.gender,this.alcTolLevel);
      this.isOpenAlcTolerance   = false;
    }
    if(!this.isOpenWeight && !this.isOpenGgtp && !this.isOpenAlcTolerance){
      this.windowSvc.resumeAdBannerByModal();
    }
  }
  public modalCancel(){
    this.isOpenWeight         = false;
    this.isOpenGgtp           = false;
    this.isOpenAlcTolerance   = false;
    this.windowSvc.resumeAdBannerByModal();
    
  }
  public selectBodyInfo( _bodyInfo:IBody){
    const _curTime        = _bodyInfo.time;
    this.utcDateCurr      = this.dateSvc.isoToUtcDate(_curTime);
    this.weight           = _bodyInfo.weight;
    this.fatRate100       = Num.float(_bodyInfo.fatRate * 100, APP_CONFIG.DEC_PLACE_DEF);
  }
  public selectBloodInfo( _bloodInfo:IBlood){
    const _curTime        = _bloodInfo.time;
    this.utcDateCurr      = this.dateSvc.isoToUtcDate(_curTime);
    this.ggtp             = _bloodInfo.ggtp;
    this.astgot           = _bloodInfo.astgot;
    this.altgpt           = _bloodInfo.altgpt;
  }
  public saveData( key:string){
    if (key === 'weight'){
      const _isoTime  = this.dateSvc.utcDateToIso(this.utcDateCurr);
      this.drinkSvc.setBodyInfo(_isoTime, this.weight, this.fatRate100/100);

    } else if (key === 'ggtp'){
      const _isoTime  = this.dateSvc.utcDateToIso(this.utcDateCurr);
      this.drinkSvc.setBloodInfo(_isoTime, this.ggtp, this.astgot, this.altgpt);

    }
  }
  public deleteBodyInfo(_bodyId:number){
    this.drinkSvc.deleteBodyInfo(_bodyId);
    this.slidingListWeight.closeSlidingItems();

  }
  public deleteBloodInfo(_bloodId:number){
    this.drinkSvc.deleteBloodInfo(_bloodId);
    this.slidingListGgtp.closeSlidingItems();

  }
  //===========================================================================
  public async allClear(){
    await this.alertSvc.showAlert2bExec(
      '設定クリア','飲酒記録や身体情報など登録したデータは消えません',
      () => {
        this.debugSvc.checkSuperuser();
        this.appmodeSvc.clearBackup();
        this.appmodeSvc.readBackup();
        this.windowSvc.clearBackup();
        this.windowSvc.readBackup();
        this.drinkSvc.clearBackup();
        this.drinkSvc.readBackup();
        this.alertSvc.showAlert1bMessage('設定クリア','');
        this.debugSvc.afterAllClear();
      }
    );
  }
  public changeAdminMode(){
    this.debugSvc.changeProductMode();
    this.cdr.detectChanges(); 
  }
  //===========================================================================
}
