import { Injectable } from '@angular/core';
import { Drink, Party } from 'src/app/class/drink';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { IDrink, IParty, IPartySummary } from 'src/app/interface/drink';
//---
import { Num, Str, Util } from 'src/app/utils/util';
import { AlertService } from '../infra/alert-service';
import { DateService } from '../infra/date-service';
//---
import { HealthService } from './health-service';
import { DrinkService } from './drink-service';
import { MenuService } from './menu-service';
import { DiaryService } from './diary-service';

export interface IDisplayParty {
  id:                 number;
  originalIndex:      number;   // 元の配列のインデックス (選択時に使用)
  isTarget:           boolean;  // targetPartyIndex と一致しているか
  displayTime:        string;   // strDateHM(p.time) の結果
  displayMonthDayHM:  string;   // strMonthDayHM(d.time) の結果を入れる
  num:                number;   // p.num
  drinkSpeedText:     string;   // strDrinkSpeed(p) の結果
  sumAlcoholText:     string;   // strSumAlcohol(p) の結果
  bgColor:            string;   // colorbloodAlcohol(p).bgColor の結果
  textColor:          string;   // colorbloodAlcohol(p).textColor の結果
  memo:               string; 
}
export interface ISummaryDisplayData {
  numSumAlcohol:      number;       // アルコール量 (g)
  numSumMl:           number;
  lastDrinkAlc:       IDrink;
  sumAlcohol:         string;   // アルコール量 (g)
  sumAlcoholBottle:   string;   // アルコール量 (本)
  drinkSpeed:         string;   // 飲むはやさ (g/時間)
  drinkSpeedBottle:   string;   // 飲むはやさ (本/時間)
  bloodBgColor:       string;   // bloodAlcoholCur.bgColor
  bloodTextColor:     string;   // bloodAlcoholCur.textColor
  bloodLevelText:     string;
  pinLeftPosition:    number;
  limitName:          string;
  remainAlcText:      string;
  remainAlcTextColor: string;
  remainAlcBgColor:   string;
  remainAlcNum:       number;
  requiredWater:      string;
  drinkSummary:       IPartySummary[]; 
}
export class SummaryDisplayData implements ISummaryDisplayData {
  numSumAlcohol:      number = 0;
  numSumMl:           number = 0;
  lastDrinkAlc:       IDrink = new Drink();
  sumAlcohol:         string = '0';
  sumAlcoholBottle:   string = '0';
  drinkSpeed:         string = '0';
  drinkSpeedBottle:   string = '0';
  bloodBgColor:       string = '';
  bloodTextColor:     string = '';
  bloodLevelText:     string = '';
  pinLeftPosition:    number = 0;  
  limitName:          string = '';
  remainAlcText:      string = '';
  remainAlcTextColor: string = '';
  remainAlcBgColor:   string = '';
  remainAlcNum:       number = 0;
  requiredWater:      string = '';
  drinkSummary:       any[] = [];
  constructor(init?: Partial<ISummaryDisplayData>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}
//===========================================================================
@Injectable({
  providedIn: 'root',
})
//===========================================================================
export class PartyService {

  public  arrParty:IParty[]                   = [];
  public shouldScrollToLatestOrder: boolean   = false;
  //---
  private lastPartyId:number                  = -1;
  private lastDrinkDate:Date|null             = null;
  private timerIdRemindAlert: any             = null;
  private _adRewardExpireDate:number          = 0;
  private estimateNextOrderDate:Date|null     = null;

  constructor(
    private alertSvc: AlertService,
    private dateSvc: DateService,
    private diarySvc: DiaryService,
    private drinkSvc: DrinkService,
    private healthSvc: HealthService,
    private menuSvc: MenuService,
  ){
  }
  //===========================================================================
  public async initialize(){
    this.drinkSvc.initialize();
    this.healthSvc.initialize();
    this.diarySvc.initialize();
    this.menuSvc.initialize();
    this.arrParty   = this.makeArrParty(this.drinkSvc.arrDrink);
  }
  public readBackup(){
    this.drinkSvc.readBackup();
    this.healthSvc.readBackup();
    this.diarySvc.readBackup();
    this.menuSvc.readBackup();
  }
  public clearBackup(){
    this.drinkSvc.clearBackup();
    this.healthSvc.clearBackup();
    this.diarySvc.clearBackup();
    this.menuSvc.clearBackup();
  }
  public clearBackupDebug(){
    this.drinkSvc.clearBackupDebug();
    this.healthSvc.clearBackupDebug();
    this.diarySvc.clearBackupDebug();
    this.menuSvc.clearBackupDebug();
  }
  //===========================================================================
  public get strPartyDate(): string {
    return this.dateSvc.isoToStrDate(this.lastParty.time);
  }
  public arrDrinkAtParty( targetIdx:number, _arrDrinkAll:IDrink[]) : IDrink[]  {
    return this._arrDrinkAtParty(targetIdx, this.arrParty, _arrDrinkAll);
  }
  public partyInfo( targetIdx:number): IParty {
    if ( targetIdx < 0 ||   targetIdx >= this.arrParty.length){
      return new Party();
    }
    return this.arrParty[targetIdx];;
  }
  public get lastParty(): IParty {
    if (this.arrParty.length === 0 ){
      return new Party();
    } else {
      return this.arrParty[this.arrParty.length-1];
    }
  }
  public arrPartyAtYearMonth( _year:number, _month:number): IParty[]{
    const _arrParty     = this.arrParty.filter(party => {
      const retval = this.dateSvc.dateInfo(this.dateSvc.isoToUtcDate(party.time))
      return retval.year === _year && retval.month === _month
    });
    return _arrParty;
  }
  //===========================================================================
  public async addDrink( _name:string, _glass:string, _content:number, _ml:number, _coef:number, _nowDate:Date):Promise<boolean> {
    console.log('[Drink]addDrink:',_name,_glass,_content,_ml);
    if (this.lastDrinkDate === null){
      this.addNewParty(_nowDate);
    } else {
      if ( this.dateSvc.isIntervalSecAtoB(this.lastDrinkDate, _nowDate,  APP_CONFIG.PARTY_INTERVAL*60*60 )){
        this.addNewParty(_nowDate);
      }
    }
    if (this.arrParty[this.arrParty.length-1].sumAlcohol > APP_CONFIG.ALCOHOL_MAX){
      await this.alertSvc.showAlert1bMessage('登録できません','お前はもう死んでいる');
      return false;
    }
    this.drinkSvc.addDrink( _name, _glass, _content, _ml, _coef, _nowDate);
    this.saveRecord();
    this.shouldScrollToLatestOrder  = true;
    //---

    //    this.setNoticeRemind();
    return true;
  }
  //===========================================================================
  private addNewParty( _startDate:Date ){
    try {
      this.lastPartyId++;
      const _newId:number       =  this.lastPartyId;
      const _startTime:string   = _startDate.toISOString();
      const newPartyData        = new Party(_newId, _startTime);
      this.arrParty.push(newPartyData as any);
      this.arrParty             = [...this.arrParty];
    } catch (error){
      console.error('[Drink] 配列の追加処理中に予期せぬエラーが発生しました:', error);
    }
  }
  public deleteDrink(drinkId:number){
    this.drinkSvc.deleteDrink(drinkId);
    this.saveRecord();
  }
  public saveRecord(){
    const _arrDrink = this.drinkSvc.sortArrDrink()
    this.arrParty   = this.makeArrParty(_arrDrink);
    if (this.arrParty.length === 0) {
      this.lastPartyId = -1;
    } else {
      const lastIdx = this.arrParty.length - 1;
      this.lastPartyId = this.arrParty[lastIdx].id;
      this.lastDrinkDate = this.dateSvc.isoToUtcDate(_arrDrink[_arrDrink.length - 1].time);
    }
    this.arrParty = [...this.arrParty];
    this.estimateNextOrderDate  =  this.estimateNextOrder();
  }
  private estimateNextOrder(){
    const lastParty = this.lastParty;
    if (lastParty.speed > 0){
      const alc:number  = this.drinkSvc.calcAlcohol(lastParty.lastDrinkAlc.alContent, lastParty.lastDrinkAlc.ml, lastParty.lastDrinkAlc.coef);
      const intervalMin:number = alc / lastParty.speed;
      if (intervalMin > 5 ){
        const lastDrink = this.drinkSvc.lastDrink;
        const nextMs:number  = this.dateSvc.isoToUtcDate( lastDrink.time).getTime() + intervalMin*60*1000;
        const estDate = new Date(nextMs);
        console.log('Next', estDate.toString());
        return estDate;
      }
    }
    return null;
  }
  //===========================================================================
  private makeArrParty( _arrDrink:IDrink[]): IParty[]{
    
    let _arrParty:IParty[]      = [];
    let _prevGetTime:number   = 0;
    let _partyId:number       = 0
    for ( let d of _arrDrink){
      const _currGetTime  = this.dateSvc.isoToUtcDate(d.time).getTime();
      const _intervalMs   = _currGetTime - _prevGetTime;
      if (_intervalMs > APP_CONFIG.PARTY_INTERVAL*60*60*1000){
        const newPartyData    = new Party(_partyId, d.time);
        _arrParty.push(newPartyData as any);
        _partyId++;
      }
      _prevGetTime              = _currGetTime;
    }
    _partyId  = 0;
    for ( let p of _arrParty){
      p.id                      = _partyId;
      const retVal              = this.makeSummary(p.id,_arrParty,_arrDrink);
      p.sumAlcohol              = retVal.sumAlcohol;
      p.sumMl                   = retVal.sumMl;
      p.lastDrinkAlc            = retVal.lastDrinkAlc;
      p.num                     = retVal.sumNum;
      p.speed                   = retVal.speed;
      p.summary                 = retVal.summary;
      _partyId++;
    }
    return _arrParty;
  }
  //===========================================================================
  public convertToDisplayArrParty(arrParty: any[], _targetPartyIndex:number, isReverse:boolean): IDisplayParty[] {
    if (!arrParty) return [];

    // 元のインデックスと色・文字の計算を済ませた配列を作る
    const calculatedArrParty = arrParty.map((p, index) => {
      const color = this.colorbloodAlcohol(p);
      return {
        id:                 p.id,
        originalIndex:      index,
        isTarget:           _targetPartyIndex === index,
        displayTime:        this.dateSvc.isoToStrDateHM(p.time, true,true),
        displayMonthDayHM:  this.dateSvc.isoToStrMonthDay(p.time) + ' ' + this.dateSvc.isoToStrHM(p.time),
        num:                p.num,
        drinkSpeedText:     this.strDrinkSpeed(p),
        sumAlcoholText:     this.strSumAlcohol(p),
        bgColor:            color.bgColor,
        textColor:          color.textColor,
        memo:               this.diarySvc.getContent(p.time),
      };
    });
    if (isReverse){
      return calculatedArrParty.reverse();
    } else {
      return calculatedArrParty;
    }
  }
  public convertToPartySummary(partyIndex: number): ISummaryDisplayData {
    const _curParty = this.partyInfo(partyIndex);
    const bloodAlcoholCur = _curParty 
      ? this.healthSvc.strBloodAlcohol(_curParty.sumAlcohol, _curParty.time)
      : null;

    // 💡 直前の bloodAlcoholCur から値を安全に取得するよう修正
    const bac = bloodAlcoholCur?.val100 || 0;
    let calculatedPinPos = 0;
    if (bac <= 0) {
      calculatedPinPos = 0;
    } else if (bac >= 0.50) {
      calculatedPinPos = 100;
    } else {
      calculatedPinPos = Math.round((bac / 0.50) * 100);
    }
    const remVal            = this.remainAlcLimit(_curParty.sumAlcohol, _curParty.time);
    const remainAcl:number  = remVal.numVal;
    const remColor          = this.drinkSvc.colorAlcLevel(remainAcl);
    return {
      numSumAlcohol:      _curParty.sumAlcohol,
      numSumMl:           _curParty.sumMl,
      lastDrinkAlc:       _curParty.lastDrinkAlc,
      sumAlcohol:         Str.float( _curParty.sumAlcohol , 2 ),
      sumAlcoholBottle:   Str.float(this.drinkSvc.calcAlcoholUnit(_curParty.sumAlcohol), APP_CONFIG.DEC_PLACE_DEF),
      drinkSpeed:         _curParty.speed === 0 ? '--' : Str.float( _curParty.speed *60, APP_CONFIG.DEC_PLACE_DEF),
      drinkSpeedBottle:   _curParty.speed === 0 ? '--' : Str.float( this.drinkSvc.calcAlcoholUnit(_curParty.speed *60) , APP_CONFIG.DEC_PLACE_DEF),
      bloodBgColor:       bloodAlcoholCur?.bgColor || '',
      bloodTextColor:     bloodAlcoholCur?.textColor || '',
      bloodLevelText:     bloodAlcoholCur ? `${bloodAlcoholCur.text} (${bloodAlcoholCur.level})` : '',
      pinLeftPosition:    calculatedPinPos,
      limitName:          remVal.limitName,
      remainAlcText:      Str.float(remainAcl, APP_CONFIG.DEC_PLACE_DEF) + 'g',
      remainAlcBgColor:   remColor.bgColor,
      remainAlcTextColor: remColor.textColor,
      remainAlcNum:       remainAcl,
      requiredWater:      Str.float( this.healthSvc.waterForAlcohol(_curParty.sumAlcohol,_curParty.sumMl), 0) + 'ml',
      drinkSummary:       _curParty?.summary || []
    };
  }
  private colorbloodAlcohol( _party:IParty): { bgColor:string, textColor:string} {
    const _retVal = this.healthSvc.strBloodAlcohol(_party.sumAlcohol, _party.time);
    return  { bgColor:     _retVal.bgColor,
              textColor:  _retVal.textColor}
  }
  private strDrinkSpeed( _party:IParty): string {
    if (_party.speed === 0){
      return '--';
    } else {
      return Str.float( _party.speed *60, APP_CONFIG.DEC_PLACE_DEF);
    }
  }
  private strSumAlcohol( _party:IParty) : string {
    return Num.float(_party.sumAlcohol,APP_CONFIG.DEC_PLACE_DEF) + 'g' 
  }
  //===========================================================================
  private  _arrDrinkAtParty( targetIdx:number, _arrParty:IParty[], _arrDrink:IDrink[]): IDrink[] {
    if (_arrParty.length === 0 ){
      return [];
    }
    if ( 0<= targetIdx && targetIdx < _arrParty.length){
      const timePartyStart:string   = _arrParty[targetIdx].time;
      const nextTargetIdx:number    = targetIdx +1;
      let  timePartyEnd:string      = APP_CONFIG.SYSTEM_MAX_DATE;
      if ( nextTargetIdx < _arrParty.length){
        timePartyEnd                = _arrParty[nextTargetIdx].time;
      }
      const drinks  = _arrDrink.filter( p => 
        ( this.dateSvc.isIntervalSecAtoBisoDate( timePartyStart, p.time , 0) === true &&
          this.dateSvc.isIntervalSecAtoBisoDate( p.time,timePartyEnd , 1) === true    ) );
      return drinks;
    } else {
      return [];
    }
  }
  private makeSummary( partyId:number, _arrParty:IParty[], _arrDrink:IDrink[]): { summary:IPartySummary[], sumAlcohol:number, sumMl:number, sumNum:number, speed:number, lastDrinkAlc:IDrink}{
    const _arrD = this._arrDrinkAtParty(partyId,_arrParty,_arrDrink);
    let _tmpSummary:IPartySummary[] = [];
    let _sumAl:number     = 0;
    let _sumMl:number     = 0;
    let _sumNum:number    = 0;
    let _lastDrinkAlc     = new Drink();
    for ( let d of _arrD ){
      if (d.alContent > 0){
        _sumNum       = _sumNum + 1;
        _lastDrinkAlc = d;
      }
      _sumAl  = _sumAl + this.drinkSvc.calcAlcohol(d.alContent, d.ml, d.coef );
      _sumMl  = _sumMl + d.ml * d.coef;
      let isFind = false;
      for ( let s of _tmpSummary ){
        if ( d.name == s.drink.name && d.glass == s.drink.glass && d.ml == s.drink.ml){
          s.num = s.num + 1;
          isFind = true;
          break;
        }
      }
      if ( !isFind ){
        _tmpSummary.push( {drink:d, num:1})
      }
    }
    const _speed:number   = this.calcDrinkSpeed(_arrD);  
    return { summary:_tmpSummary, sumAlcohol:_sumAl, sumMl:_sumMl, sumNum:_sumNum, speed:_speed, lastDrinkAlc:_lastDrinkAlc};
  }
  private calcDrinkSpeed( arrDrink:IDrink[]): number{
    let _alSum:number         = 0;
    let xValues: number[] = [];
    let yValues: number[] = [];
    let firstTimeMs: number | null = null;
    for ( let d of arrDrink){
      if (d.alContent > 0){
        const currTimeMs = new Date(d.time).getTime();
        if (firstTimeMs === null) {
          firstTimeMs = currTimeMs;
        }
        const elapsedMinutes = (currTimeMs - firstTimeMs) / (60 * 1000);
        xValues.push(elapsedMinutes);
        const _al = this.drinkSvc.calcAlcohol(d.alContent, d.ml, d.coef);
        _alSum  = _alSum + _al;
        yValues.push(_alSum);
      }
    }
    let  speedOrg:number  = Util.calculateSlope(xValues, yValues);
    if (speedOrg === 0 && arrDrink.length > 1){
      for ( let i = arrDrink.length-1; i > 0; i--){
        const _d0   = arrDrink[i-1];
        const _d1   = arrDrink[i];
        const _ms   = new Date(_d1.time).getTime() - new Date(_d0.time).getTime();
        const _alc0 = this.drinkSvc.calcAlcohol(_d0.alContent, _d0.ml, _d0.coef);
        const _alc1 = this.drinkSvc.calcAlcohol(_d1.alContent, _d1.ml, _d1.coef);
        const _alc  = Math.max( _alc0 , _alc1-_alc0 );
        if (_alc > 0 ){
          speedOrg    = _alc / _ms *  (60 * 1000);
          break;
        }
      }
      console.log(speedOrg)
    }
    return speedOrg
  }
  private remainAlcLimit( sumAlcohol:number, _isoDate:string): { numVal:number, limitName:string}{
    const _yLinesSetting      = this.healthSvc.makeDrinkChartYLineSetting(sumAlcohol,_isoDate);
    const _remainAcl:number   = _yLinesSetting[_yLinesSetting.length-1].yValue - sumAlcohol;
    const _limitName:string   = _yLinesSetting[_yLinesSetting.length-1].labelText;
    return {numVal:_remainAcl, limitName:_limitName};
  }
  public calcRateDrinkedDay( baseTime:string, lookbackDays:number): { rateDrinkedDay:number, sumAlcohol:number }{
    if (lookbackDays <= 0){
      return {rateDrinkedDay:0, sumAlcohol:0}
    }
    const isoTimeEnd        = baseTime;
    const startDate     = new Date(baseTime);
    startDate.setDate(startDate.getDate() - lookbackDays);
    const isoTimeltStart = this.dateSvc.utcDateToIso(startDate);

    const filteredParties = this.arrParty.filter(party => {
        return party.time >= isoTimeltStart && party.time <= isoTimeEnd;
    });
    let _sumAlc:number  = 0;
    let _dayDrinked     = 0;
    let _prevDay        = 0;    
    for ( let p of filteredParties){
      _sumAlc = _sumAlc + p.sumAlcohol;
      const _curDay     = this.dateSvc.isoToUtcDate(p.time).getDate();
      if (_prevDay !== _curDay){
        _dayDrinked++;
        _prevDay        = _curDay;
      }      
    }
    const _rateDrinkedDay:number = _dayDrinked / lookbackDays;
    return  {rateDrinkedDay:_rateDrinkedDay, sumAlcohol:_sumAlc }
  }
  //===========================================================================
  private setNoticeRemind(){
    this.clearNoticeRemind();
    const _nextChenckSec = 5;
    console.log(_nextChenckSec,'秒後にアラート')
    this.timerIdRemindAlert = setTimeout(() => {
      this.checkAndAutoNoticeRemind();
    }, _nextChenckSec * 1000);
  }
  private async checkAndAutoNoticeRemind(){
    const _expireTime:number = this._adRewardExpireDate;
    const dateText = new Date(_expireTime).toLocaleString('ja-JP');
    console.log('[Ad]有効期限：expireTime',dateText)

    if (_expireTime > 0){
      const now = Date.now();
      if ( now - _expireTime >= 500 ){
        console.log('[Ad]報酬切れ...バナー復帰')
        this.clearNoticeRemind();
        this.alertExec();

      }
    } else {
        console.log('[Ad]報酬なし...バナー復帰')
        this.clearNoticeRemind();
        this.alertExec();
    }
  }
  private clearNoticeRemind(){
    if (this.timerIdRemindAlert !== null) {
      clearTimeout(this.timerIdRemindAlert);
      this.timerIdRemindAlert = null;
      console.log('タイマークリア')
    }
  }
  private execAdRewardGrant() : number{    
    //広告報酬獲得
    let _nextChenckSec = 5;
    _nextChenckSec = Math.ceil((this._adRewardExpireDate - Date.now() ) /1000);  
    if (_nextChenckSec <= 0){
      _nextChenckSec = 5;
    }
    return _nextChenckSec;
  }
  private async alertExec(){
    //広告報酬期限切れ
    this._adRewardExpireDate = 0;
    // もし一度も動画を見ていない、または期限の引き出しが空っぽなら通常通りバナーを即射出！
//    await this.adSvc.loadAdBanner(this);
    await this.alertSvc.showAlert1bMessage('通知','記録忘れ？')
  }
  //===========================================================================
}
