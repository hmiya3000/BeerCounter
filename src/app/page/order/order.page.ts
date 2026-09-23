import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonList, IonItem, IonLabel, IonButton, IonItemOption, IonItemOptions, IonItemSliding, IonIcon, IonGrid, IonRow, IonCol, IonCard, IonRange, IonModal, IonLoading } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, timeOutline, square, calendarOutline, beer, documentText, documentTextOutline, searchOutline, water, cafe, filter, wine } from 'ionicons/icons';
import {  DrinkService, IDisplayDrink, ITipsBloodAlcohol} from 'src/app/service/features/drink-service';
import { DateService } from 'src/app/service/date-service';
import { AlertService } from 'src/app/service/alert-service';
import { IDrink } from 'src/app/interface/drink';
import { Num, Str, Util } from 'src/app/utils/util';
import { ChartComponent } from 'src/app/components/chart/chart.component';
import { ChartService } from 'src/app/service/chart-service';
import { SharedModalComponent } from "src/app/components/shared-modal/shared-modal.component";
import { Drink } from 'src/app/class/drink';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { SwipeLayoutComponent } from 'src/app/components/swipe-layout/swipe-layout.component';
import { InlineDatetimeComponent } from 'src/app/components/inline-datetime/inline-datetime.component';
import { WindowService } from 'src/app/service/window-service';
import { InputService } from 'src/app/service/input-service';
import { FreetextInputComponent } from 'src/app/components/freetext-input/freetext-input.component';
import { IDisplayParty, ISummaryDisplayData, PartyService, SummaryDisplayData } from 'src/app/service/features/party-service';
import { MenuService } from 'src/app/service/features/menu-service';
import { HealthService } from 'src/app/service/features/health-service';
import { DiaryService } from 'src/app/service/features/diary-service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: true,
  imports: [IonLoading, IonModal, IonRange, IonCard, IonRow, IonCol, IonIcon, IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonButton, IonItem, IonList, IonContent, CommonModule, FormsModule, IonGrid, IonButton, ChartComponent, SharedModalComponent, SwipeLayoutComponent, InlineDatetimeComponent,FreetextInputComponent ]
})
export class OrderPage implements OnInit {

  @ViewChild('pageContent', { static: false }) content!: IonContent;
  @ViewChild('slidingList') slidingList!: HTMLIonListElement;
  //---
  public displayArrDrinkCurr: IDisplayDrink[] = []; // 今回の飲み会用
  public displayArrDrinkAll: IDisplayDrink[]  = [];  // 全ドリンク用
  public displayArrParty: IDisplayParty[]     = [];
  public summaryDisplay: ISummaryDisplayData  = new  SummaryDisplayData()
  public  partyMemoCurr:string                = '';
  public  partyIsoTime:string                 = '';
  //---
  public  isOpenAlcoholLevel:boolean      = false;
  public  chartHeight:number              = 200;
  public  isLoaded:boolean                = false;

  public  isOpenDrinkDetail:boolean       = false;
  public  curDrink:IDrink                 = new Drink();
  public  isEditDrink:boolean             = false;
  public  utcDateCurr:Date                = new Date();

  public  isOpenAllParty:boolean          = false;
  //---
  public  isOpenAllDrink:boolean          = false;
  public  isNoDuplicateDrink:boolean      = false;
  public  isConverting:boolean            = false;  
  //---
  public  targetPartyIndex:number         = 0;
  public  hourSleep:number                = 8;
  public  minAlcClearance:number          = 0;
  private timeAlcClearance:string         = '';
  public  tipsAlcClearance:string         = '分解時間は体調・体質・年齢などで大幅に変わります。\nあくまでも目安であり自動車運転などの判断には使えません。'
  public  tipsrequiredWater:string        = '飲酒で抜けてしまう水分量です。\nお酒と交互にチェイサーを飲みましょう。'
  //---
  public  isOpenLimitDrink:boolean        = false;

  public  alContent1000Curr:number        = 0;
  public  alMin1000:number                = 0;
  public  alMax1000:number                = 0;
  public  alStep1000:number               = 0;
  public  mlCurr:number                   = 0;
  public  mlMin:number                    = 0;
  public  mlMax:number                    = 0;
  public  mlStep:number                   = 0;
  public  coef100Curr:number              = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    private diarySvc: DiaryService,
    public  drinkSvc: DrinkService,
    private alertSvc: AlertService,
    public  chartSvc: ChartService,
    public  dateSvc: DateService,
    private healthSvc: HealthService,
    private inputSvc: InputService,
    private menuSvc: MenuService,
    private partySvc: PartyService,
    private windowSvc: WindowService,
  ) {
    addIcons({beer,timeOutline,trash,wine,water,documentTextOutline,filter,cafe,searchOutline,documentText,calendarOutline,square});    
  }
  ngOnInit() {
    this.partySvc.readBackup();
  }
  ionViewWillEnter(){
    this.menuSvc.menuLoaded$.subscribe((loaded: boolean) => {
      if (loaded) {
        this.partySvc.readBackup();
        this.initParam();
      }
    });
  }
  ionViewDidEnter(){
    this.isLoaded = true;
    this.cdr.detectChanges();
    this.updateChart();
    if (this.partySvc.shouldScrollToLatestOrder) {
      if (this.content) {
        setTimeout(() => {
          this.content.scrollToBottom(300);
          this.partySvc.shouldScrollToLatestOrder = false;
        }, 100);
      }
    }
  }
  ionViewWillLeave(){
    this.slidingList.closeSlidingItems();
  }
  //===========================================================================
  private get arrDrinkAtParty(): IDrink[] {
    return this.partySvc.arrDrinkAtParty(this.targetPartyIndex, this.drinkSvc.arrDrink);
  }
  public get isDrinkStart() : boolean {
    return this.arrDrinkAtParty.length > 0 ? true : false;
  }
  public get isLastParty(): boolean {
    return (this.targetPartyIndex === this.partySvc.arrParty.length -1) ? true : false;
  }
  public get strPageTitle(): string {
    if (this.targetPartyIndex === this.partySvc.arrParty.length -1){
      return '注文履歴';
    } else {
      const targetParty = this.partySvc.partyInfo(this.targetPartyIndex);
      if (targetParty.time !== ''){
        return  this.dateSvc.isoToStrDate(targetParty.time);
      } else {
        return '飲酒なし'
      }
    }
  }
  //---
  public get strPartyDate() : string{
    const targetParty = this.partySvc.partyInfo(this.targetPartyIndex);
    if (targetParty.time !== ''){
      return  this.dateSvc.isoToStrDateHM(targetParty.time, true, true) +'〜';
    } else {
      return '飲酒なし'
    }
  }
  public get strAlcoholCurr(): {text:string, bgColor:string, textColor:string} {
    const alcohol:number  = this.drinkSvc.calcAlcohol(this.alContent1000Curr/1000, this.mlCurr,this.coef100Curr/100);
    const color           = this.drinkSvc.colorAlcLevel(alcohol);
    return { text: Str.float( alcohol, APP_CONFIG.DEC_PLACE_DEF) + 'g',
            bgColor:  color.bgColor,
            textColor:  color.textColor}
  }
  public strDrinkAlContent(_alContent:number): string {
    return Str.float(_alContent*100, APP_CONFIG.DEC_PLACE_DEF );
  }
  public strDrinkMl(_ml:number): string {
    return Str.float(_ml, 0 );
  }
  public strDrinkCoef(_coef:number): string {
    return Str.ratePct(_coef, APP_CONFIG.DEC_PLACE_DEF );
  }
  public get arrTipsBloodAlcohol(): ITipsBloodAlcohol[] {
    return this.drinkSvc.arrTipsBloodAlcohol
  }
  //===========================================================================
  private initParam(){
    this.targetPartyIndex = this.partySvc.arrParty.length-1;
    this.updatePartyCur();
  }
  public modalOpen( key:string ){
    this.windowSvc.hideAdBannerByModal();
    if ( key === 'alcoholLevel'){
      this.isOpenAlcoholLevel       = true;

    } else if ( key === 'drinkDetail'){
      this.isOpenDrinkDetail        = true;

    } else if ( key === 'allParty'){
      this.updatePartyAll();
      this.isOpenAllParty           = true;

    } else if ( key === 'allDrink'){
      this.isConverting             = true;
      this.updateDrinkAll();
      this.isOpenAllDrink           = true;
      this.isConverting             = false;

    }
  }
  public modalConfirm( isConfirm:boolean, key:string ){
    if ( key === 'alcoholLevel'){
      this.isOpenAlcoholLevel       = false;

    } else if ( key === 'drinkDetail'){
      if (isConfirm){
        const _prevPartyLength = this.partySvc.arrParty.length;
        this.setDrinkDetailCurr();
        if (this.targetPartyIndex === _prevPartyLength -1){
          this.toLastParty();
        }
        this.updatePartyCur();
        this.updateChart();
        if (this.isOpenAllDrink){
          this.updateDrinkAll();
        }
      }
      this.isEditDrink            = false;
      this.isOpenDrinkDetail      = false;

    } else if ( key === 'allParty'){
      this.isOpenAllParty           = false;

    } else if ( key === 'allDrink'){
      this.isOpenAllDrink         = false;

    }
    if(!this.isOpenAlcoholLevel && !this.isOpenDrinkDetail && !this.isOpenAllParty && !this.isOpenAllDrink){
      this.windowSvc.resumeAdBannerByModal();
    }
  }
  public modalCancel(){
    this.isOpenAlcoholLevel       = false;
    this.isOpenDrinkDetail        = false;
    this.isOpenAllParty           = false;
    this.isOpenAllDrink           = false;
    this.windowSvc.resumeAdBannerByModal();
  }
  public modalHeaderClick( ev:any, key:string){
    const _dir:number = ev.dir;
    if ( key === 'drinkDetail'){
      const _curId:number   = this.curDrink.id
      const _curIdx:number  = this.arrDrinkAtParty.findIndex( drink => drink.id == _curId);
      if ( _dir <  0){
        if ( _curIdx > 0){
          this.isEditDrink  = false;
          const prevDrink   = this.arrDrinkAtParty[_curIdx -1];
          this.selectDrink(prevDrink.id);
        }
      } else if ( _dir > 0){
        if (  _curIdx <  this.arrDrinkAtParty.length-1 && _curIdx >= 0){
          this.isEditDrink  = false;
          const nextDrink   = this.arrDrinkAtParty[_curIdx +1];
          this.selectDrink(nextDrink.id);
        }
      }
    }
  }
  public enableHeaderButton( isForward:boolean, key:string): boolean{
    if ( key === 'drinkDetail'){
      const _curId:number   = this.curDrink.id
      const _curIdx:number  = this.arrDrinkAtParty.findIndex( drink => drink.id == _curId);
      if (isForward){
        return ( _curIdx <  this.arrDrinkAtParty.length-1) ? true : false;
      } else {
        return ( _curIdx >  0 ) ? true : false;
      }
    } else if ( key === 'allParty'){
      if (isForward){
        return (this.targetPartyIndex < this.partySvc.arrParty.length -1) ? true : false;
      } else {
        return (this.targetPartyIndex > 0 ) ? true : false;
      }
    }
    return false;
  }
  public headerClick( ev:any, key:string){
    const _dir:number = ev.dir;
    if ( key === 'allParty'){
      if (_dir === 0){        
        this.modalOpen('allParty');
      } else if (_dir > 0){
        const _index  = this.targetPartyIndex +1;
        if (_index < this.partySvc.arrParty.length){
          this.selectParty(_index);
        }

      } else if (_dir < 0){
        const _index  = this.targetPartyIndex -1;
        if (_index >= 0){
          this.selectParty(_index);
        }
      }
    }
    this.slidingList.closeSlidingItems();
  }
  public onIonInputBlur(ev:any, type:string, key:string){
    const value = ev.target!.value || '';
    if ( key === 'partyMemo'){
      ev.target.value             = this.inputSvc.readUpdateText( value, type, this.partyMemoCurr, APP_CONFIG.MEMO_LENGTH_MAX);
      if (ev.target.value !== this.partyMemoCurr){
        this.partyMemoCurr        = ev.target.value;
        this.diarySvc.setContent(this.partyMemoCurr, this.partyIsoTime );
      }
    }
  }

  public onIonRange(ev:any, type:string, key:string){
    if (key === 'hourSleep'){
      const _hourSleep:number = ev.detail.value;
      this.inputSvc.onIonRange(_hourSleep, type, 0, (val) => this.upudateHourSleep(val,0), this.cdr);

    } else if (key === 'alContent'){
      const _alContent1000:number = ev.detail.value;
      this.inputSvc.onIonRange(_alContent1000, type, 0, (val) => this.upudateAlContent(val,0), this.cdr);

    } else if ( key === 'ml'){
      const _ml:number = ev.detail.value;
      this.inputSvc.onIonRange(_ml, type, 0, (val) => this.upudateMl(val,0), this.cdr);

    } else if ( key === 'coef'){
      const _coef100:number = ev.detail.value;
      this.inputSvc.onIonRange(_coef100, type, 0, (val) => this.upudateCoef(val,0), this.cdr);

    }   
  }
  private upudateHourSleep(_hourSleep:number, _id:number = 0){
    this.hourSleep  = _hourSleep;
    const arrDrinkAtPartyLenght:number = this.arrDrinkAtParty.length
    if ( arrDrinkAtPartyLenght > 0){
      const lastDrink       = this.arrDrinkAtParty[arrDrinkAtPartyLenght-1];
      const retVal          = this.healthSvc.alcClearanceTime(this.summaryDisplay.numSumAlcohol,this.hourSleep, lastDrink.time);
      this.minAlcClearance  = Num.float(retVal.min, 2) ;
      this.timeAlcClearance = this.dateSvc.isoToStrHM(retVal.time);
    }
  }
  private upudateAlContent( _alContent1000:number, _itemId:number){
    this.alContent1000Curr  = _alContent1000;
  }
  private upudateMl( ml:number, _itemId:number){
    this.mlCurr             = ml;
  }
  private upudateCoef( _coef100:number, _itemId:number){
    this.coef100Curr        = _coef100;
  }

  public get strAlcClearanceTime(): string{
    return this.timeAlcClearance
  }
  public initHourSleep(){
    this.upudateHourSleep(8);
  }
  //===========================================================================
  public async openBrowser(_targetUrl:string){
    await Util.openExtBrowser(_targetUrl);
  }
  //===========================================================================
  public toLastParty(){
    this.selectParty(this.partySvc.arrParty.length-1)
  }
  public async openChangeDrinkTime(_drinkId:number, isTemp:boolean, _is12hour:boolean ){
    const _targetDrink  = this.drinkSvc.curDrink(_drinkId);
    const isoTime       = _targetDrink.time;
    const _utcDate      = this.dateSvc.isoToUtcDate(isoTime);
    const _placeholder  = this.drinkSvc.strXXXXPlaceholder(_utcDate);
    const _message      = this.drinkSvc.strXXXXMessage(_utcDate,_is12hour);
    this.slidingList.closeSlidingItems();
    let shouldUpdate = false;
    let newHHMMValue = '';    
    setTimeout(async () => {
      this.cdr.detectChanges();
      //---
      await this.alertSvc.showAlert2bInNum('時刻の変更', _message, '', _placeholder, 0, 2359,
        (newHHMM) =>{
          newHHMMValue = newHHMM + '';
          shouldUpdate = true;
        }
      );
      if (shouldUpdate && newHHMMValue !== '') {
        const _newTime = this.drinkSvc.changeHHMM(newHHMMValue, isoTime, _is12hour );
        if (_newTime !== ''){
          if (isTemp){
            const _newUtcDate = this.dateSvc.isoToUtcDate(_newTime);
            this.utcDateCurr  = this.dateSvc.setHmsToUtcDate( this.utcDateCurr, _newUtcDate.getHours(),_newUtcDate.getMinutes() );
          } else {
            _targetDrink.time = _newTime;
            const _prevPartyLength = this.partySvc.arrParty.length;
            this.partySvc.saveRecord();
            if (this.targetPartyIndex === _prevPartyLength -1){
              this.toLastParty();
            }
            this.updatePartyCur();
            this.updateChart();
          }
          this.cdr.detectChanges();
        }
      }
    }, 300);
  }
  public deleteDrink(_drinkId:number){
    const _prevPartyLength = this.partySvc.arrParty.length;
    this.partySvc.deleteDrink(_drinkId);
    this.slidingList.closeSlidingItems();
    setTimeout(() => {
      if (this.partySvc.arrParty.length !== _prevPartyLength){
        this.updatePartyAll();
        this.updateDrinkAll();
        this.selectParty(this.targetPartyIndex-1);
      }
      this.updatePartyCur();
      this.updateChart();
      console.log('[Order]deleteDrink(arrDrink:',this.arrDrinkAtParty)
    }, 200); 
  }
  public async drink1up(_drinkId:number){
    if ( this.arrDrinkAtParty.length > 0){
      const _drink1up   = this.drinkSvc.curDrink(_drinkId);
      const isAdd       = await this.partySvc.addDrink(_drink1up.name, _drink1up.glass, _drink1up.alContent, _drink1up.ml, _drink1up.coef, new Date());
      if (!isAdd) return;
      this.toLastParty();
      //---
      let scrollDelayTime = 0;
      if (this.isOpenAllDrink) {
        scrollDelayTime = 350;
        this.modalCancel();
      }
      setTimeout(() => {
        this.content.scrollToBottom(300);
        this.partySvc.shouldScrollToLatestOrder = false;
      }, scrollDelayTime);
      //---
      console.log('[History]drink1up(arrDrink:',this.arrDrinkAtParty)
    }
  }
  public selectDrink( _drinkId:number){
    this.curDrink = this.drinkSvc.curDrink(_drinkId);
    this.utcDateCurr            = this.dateSvc.isoToUtcDate(this.curDrink.time);
    const _item   = this.menuSvc.getMenuItemByName(this.curDrink.name, this.curDrink.glass);
    if (_item){
      this.alContent1000Curr    = this.curDrink.alContent * 1000;
      this.alMin1000            = _item.alMin*1000;
      this.alMax1000            = _item.alMax*1000;
      this.alStep1000           = _item.alStep*1000;
      //---
      const { range:_mlRange, step:_mlStep} = this.menuSvc.getMlRangeStep(_item.ml);
      this.mlCurr               = this.curDrink.ml
      this.mlMin                = _item.ml - _mlRange;
      this.mlMax                = _item.ml + _mlRange;
      this.mlStep               = _mlStep;
      //---
      this.coef100Curr          = this.curDrink.coef *100;
    }
    if (!this.isOpenDrinkDetail){
      this.modalOpen('drinkDetail')
    }
  }
  private setDrinkDetailCurr(){
    this.curDrink.time          = this.dateSvc.utcDateToIso(this.utcDateCurr);
    this.curDrink.alContent     = this.alContent1000Curr/1000;
    this.curDrink.ml            = this.mlCurr;
    this.curDrink.coef          = this.coef100Curr/100;    
    this.partySvc.saveRecord();
  }
  public initAlContent(){
    this.alContent1000Curr  = this.curDrink.alContent *1000
  }
  public initMl(){
    this.mlCurr   = this.curDrink.ml;
  }
  public initCoef(){
    this.coef100Curr = this.curDrink.coef *100;
  }
  public selectParty( _idx:number){
    this.targetPartyIndex   = _idx;
    this.updatePartyCur();
    this.updateChart();
    if ( 0 <= _idx && _idx < this.partySvc.arrParty.length){
      this.modalConfirm(false,'allParty');
      this.cdr.detectChanges();
    }
  }
  public copyMemoPrev(){
    const count = this.partyMemoCurr === '' ? 0 : 1
    const memoPrev = this.diarySvc.getContentLast(count);
    if (memoPrev){
      this.partyMemoCurr  = memoPrev;
    }
  }
  public changeEditDrink(){
    this.isEditDrink  = !this.isEditDrink
  }
  public get lastDrink(): string{
    const lastDrink   = this.summaryDisplay.lastDrinkAlc;
    return lastDrink.name + '(' + lastDrink.glass + ')';
  }
  public get remainNum(): string{
    const lastDrink   = this.summaryDisplay.lastDrinkAlc;
    const alcohol:number  = this.drinkSvc.calcAlcohol(lastDrink.alContent,lastDrink.ml,lastDrink.coef);
    const remNum:string   = Str.float(this.summaryDisplay.remainAlcNum / alcohol, APP_CONFIG.DEC_PLACE_DEF) 
    return 'あと ' + remNum + ' 杯';
  }
  public changeDuplicateDrink(){
    this.isConverting           = true;
    this.isNoDuplicateDrink     = !this.isNoDuplicateDrink;
    this.updateDrinkAll();
    this.cdr.detectChanges();
    this.isConverting           = false;
  }
  //===========================================================================
  private updateChart(){
    this.updateChartDrinkTime();
    this.updateChartAlcoholIndicator();
  }
  private updateChartDrinkTime(){
    if (this.arrDrinkAtParty.length > 0){
      console.log('updateChartDrinkTime',this.arrDrinkAtParty);
      const _chartId      = 'drinkTime'
      const retVal        = this.drinkSvc.makeDrinkChartData(this.arrDrinkAtParty);
      const yLinesSetting = this.healthSvc.makeDrinkChartYLineSetting(retVal.alcoholMax,this.arrDrinkAtParty[0].time );
      const _max:number = yLinesSetting[yLinesSetting.length-1].yValue;
      this.chartSvc.updateChartData(_chartId, 'scatter', [retVal.alcohol], ['摂取アルコール(累積)'], retVal.time)
      this.chartSvc.updateChartOption(_chartId, {labels:retVal.time,axisMode:'time' }, {min:0,max:_max} , true, {targetYLinesSetting:yLinesSetting, targetXLines:[] });
    }
  }
  private updateChartAlcoholIndicator(){
    const indicatorId = 'drinkTimeIndicator';
    this.chartSvc.updateIndicatorData(indicatorId, this.drinkSvc.arrIndicatorBloodAlcohol);
    this.chartSvc.updateIndicatorOption(indicatorId, false);
  }
  private updatePartyCur(){
    const curParty  = this.partySvc.partyInfo(this.targetPartyIndex);
    if (curParty.time){
      this.partyIsoTime     = curParty.time
      this.partyMemoCurr    =  this.diarySvc.getContent(this.partyIsoTime);
    } else {
      this.partyIsoTime     = ''
      this.partyMemoCurr    = '';
    }
    this.displayArrDrinkCurr  = this.drinkSvc.convertToDisplayArrDrink(this.arrDrinkAtParty,false);
    this.summaryDisplay       = this.partySvc.convertToPartySummary(this.targetPartyIndex);
    if (this.isLastParty){
      this.upudateHourSleep(this.hourSleep);
    }
  }
  private updatePartyAll(){
    this.displayArrParty = this.partySvc.convertToDisplayArrParty(this.partySvc.arrParty, this.targetPartyIndex, true);
  }
  private updateDrinkAll(){
    if (this.isNoDuplicateDrink){
      const arrDrinkNoDuplicate = this.drinkSvc.makeArrDrinkNoDuplicate(this.drinkSvc.arrDrink);
      this.displayArrDrinkAll = this.drinkSvc.convertToDisplayArrDrink(arrDrinkNoDuplicate,true);
    } else {
      this.displayArrDrinkAll = this.drinkSvc.convertToDisplayArrDrink(this.drinkSvc.arrDrink,true);
    }
  }
  //===========================================================================
}