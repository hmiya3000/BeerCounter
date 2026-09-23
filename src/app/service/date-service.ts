import { Injectable } from '@angular/core';
import { parseISO, formatISO, set } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor() {}

  //===========================================================================
  public dateInfo( _utcData:Date): { utcDate:Date, year:number, month:number, date:number, term:number, isoDate:string}{
    const _year:number    = _utcData.getFullYear();
    const _month:number   = _utcData.getMonth() + 1;
    const _date:number    = _utcData.getDate();
    const _term:number    = this.toTerm(_year,_month);
    const _isoDate:string = formatISO(_utcData);
    return { utcDate:_utcData, year:_year, month:_month, date:_date, term:_term, isoDate:_isoDate}
  }
  public nowDate(): { utcDate:Date, year:number, month:number, date:number, term:number, isoDate:string}{
    const _nowDate        = new Date();
    return this.dateInfo(_nowDate);
  }
  public getDaysInMonth(year: number, month: number, isToday:boolean): number {

    if (isToday){
      const _nowDate        = new Date();
      if ( _nowDate.getFullYear() === year && _nowDate.getMonth()+1 === month){
        return _nowDate.getDate();
      }
    }
    const date = new Date(year, month, 0);
    return date.getDate(); // 日付（末日の数値）を返す
  }  
  //===========================================================================
  public newDate( year: number, month: number, date: number, hour: number = 0, minute: number = 0, second: number = 0 ): Date {
    const correctedMonth = month - 1;
    const generatedDate = new Date(year, correctedMonth, date, hour, minute, second);
    return generatedDate;
  }
  public setYmdToUtcDate( basegDate:Date, year:number, month:number, day:number ){
    month  = Math.floor(month);
    month  = month > 12 ? 12 : month;
    month  = month <  1 ?  1 : month;
    const finalDate = set(basegDate, { year: year, month: month-1, date:day})
    return finalDate;
  }

  public setHmsToUtcDate( basegDate:Date, hours:number, minutes:number, seconnds:number=0 ){
    if (hours > 23){
      hours = 23;
    }
    if (minutes > 59){
      minutes = 59;
    }
    if (seconnds > 59){
      seconnds = 59;
    }
    const finalDate = set(basegDate, { hours: hours, minutes: minutes, seconds:seconnds})
    return finalDate;
  }
  //===========================================================================
  public isIntervalSecAtoB( _dateA:Date, _dateB:Date, _sec:number){
    const _timeA = _dateA.getTime();
    const _timeB = _dateB.getTime();
    const diffMs = _timeB - _timeA;
    const _intervalMs:number  = _sec * 1000;
    const result = diffMs >= _intervalMs;
    return result;
  }
  public isIntervalSecAtoBisoDate( isoDateA:string, isoDateB:string, _sec:number){
    const _dateA  = this.isoToUtcDate(isoDateA);
    const _dateB  = this.isoToUtcDate(isoDateB);
    return this.isIntervalSecAtoB(_dateA, _dateB, _sec);
  }
  //===========================================================================
  public checkValidDate(yyyymmdd: string){
    let _arrDate = yyyymmdd.split('/');
    let year:number = Number(_arrDate[0]);
    let month:number = Number(_arrDate[1])-1;
    let date:number  = Number(_arrDate[2]);
    let dateUtc = new Date( year,  month, date, 1,1,1,0);
    let isOk = false;
    if ( year == dateUtc.getFullYear() && month == dateUtc.getMonth() && date == dateUtc.getDate() ){
      isOk = true;
    }
    return isOk;
  }
  public checkValidTime(yyyymmdd: string){
    let isOk = false;
    let _arrTime = yyyymmdd.split(' ');
    if ( _arrTime.length == 2){
      if ( this.checkValidDate( _arrTime[0] )){
        let _arrHHMM = _arrTime[1].split(':');
        if (_arrHHMM.length == 2 ){
          const _hour    = Number(_arrHHMM[0]);
          const _minutes = Number(_arrHHMM[1]);
          if ( _hour >= 0 && _hour <= 23 && _minutes >= 0 && _minutes <=  59){
            isOk = true;
          }
        } 
      } 
    }
    return isOk;
  }
  //===========================================================================
  public getLocalYear(yyyy:number){
    const date = new Date(yyyy, 12 -1 , 31, 0,0,0,0);
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese',{year:'numeric'}).format(date)
  }
  public getLocalYearShort(yyyy:number){

    let _str:string = this.getLocalYear(yyyy);
    _str = _str.replace("令和","R");
    _str = _str.replace("平成","H");
    _str = _str.replace("昭和","S");
    _str = _str.replace("大正","T");
    _str = _str.replace("明治","M");
    return _str;
  }
  //===========================================================================
  public toTerm(_year:number, _month:number): number {
    return _year * 12 + _month -1;
  }
  public termToYear( _term:number): number {
    return Math.floor(_term / 12);
  }
  public termTotMonth( _term:number): number {
    return  _term % 12 + 1;
  }
  public termToYearMonth( _term:number): {year:number, month:number} {
    return  { year: this.termToYear(_term), month:this.termTotMonth(_term) }
  }
  //===========================================================================
  public strYearMonth(_term:number){
    return this.termToYear(_term) + '年' + this.termTotMonth(_term) +'月'
  }
  public strYearMonthShort(_term:number){
    return this.termToYear(_term) + '/' + this.termTotMonth(_term)
  }
  public strYearMonthPeriod(_term:number){
    const _year:number  = Math.floor(_term / 12);
    const _month:number = _term % 12;
    if (_year > 0 ){
      if (_month !== 0){
        return _year + '年' + _month + 'ヶ月';
      } else {
        return _year + '年';
      }
    } else {
      return _month + 'ヶ月';
    }
  }
  public strShortYearMonth(_term:number){
    return this.strShortYear(this.termToYear(_term)) + "年" + this.termTotMonth(_term) + "月"
  }
  public strShortYear(_year:number) : string {
    if (_year == null){
      return '??';
    } else {
      const _shortYear = (_year % 100);
      const _strShortYear  = "'" + (_shortYear < 10 ? "0" + _shortYear : _shortYear);
      return _strShortYear;
    }
  }
  //===========================================================================
  public strNowDate(){
    const now = new Date();
    return this.utcToStrDate(now);
  }
  public strNowDateHM(){
    const now = new Date();
    return this.utcToStrDateHM(now);
  }
  public strNowDateHMS(){
    const now = new Date();
    return  now.getFullYear() +'_' +(now.getMonth()+1).toString().padStart(2,'0') + now.getDate().toString().padStart(2,'0') + '_' + now.getHours().toString().padStart(2,'0') + now.getMinutes().toString().padStart(2,'0') + '_' + now.getSeconds().toString().padStart(2,'0');
  }
  //===========================================================================
  public utcToStrDate( _utcDate:Date, isWeek:boolean = false, isJapanese:boolean = false) : string {
    if (!(_utcDate instanceof Date)) {
      _utcDate = new Date(_utcDate);
    }
    if (isJapanese){
      const weekDays: string[] = ['日', '月', '火', '水', '木', '金', '土'];
      const retStr:string =  _utcDate.getFullYear() +'年' +(_utcDate.getMonth()+1).toString().padStart(2,'0') + '月' + _utcDate.getDate().toString().padStart(2,'0') + '日';
      return  retStr + (isWeek ?  '(' + weekDays[_utcDate.getDay()] + ')' : '' );
    } else {
      const weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const retStr:string = _utcDate.getFullYear() +'/' +(_utcDate.getMonth()+1).toString().padStart(2,'0') + '/' + _utcDate.getDate().toString().padStart(2,'0');
      return retStr + (isWeek ?  '(' + weekDays[_utcDate.getDay()] + ')' : '' );
    }
  }

  public utcToStrMonthDay( _utcDate:Date): string {
    if (!(_utcDate instanceof Date)) {
      _utcDate = new Date(_utcDate);
    }
    return (_utcDate.getMonth()+1).toString().padStart(2,'0') + '/' + _utcDate.getDate().toString().padStart(2,'0');  
  }
  public utcToStrHM( _utcDate:Date) : string {
    if (!(_utcDate instanceof Date)) {
      _utcDate = new Date(_utcDate);
    }
    return _utcDate.getHours().toString().padStart(2,'0') + ':' + _utcDate.getMinutes().toString().padStart(2,'0'); 
  }
  public utcToStrDateHM( _utcDate:Date, isWeek:boolean = false, isJapanese:boolean = false) : string {
    return this.utcToStrDate(_utcDate, isWeek, isJapanese) + ' ' + this.utcToStrHM(_utcDate);
  }
  //===========================================================================
  public isoToUtcDate( isoDate: string ): Date {
    return parseISO(isoDate);
  }
  public utcDataToCalendarDate(utcDate: Date): string{
    if (!(utcDate instanceof Date) || isNaN(utcDate.getTime())) {
      utcDate = new Date();
    }
    const tzOffset = utcDate.getTimezoneOffset() * 60000;
    const localTime = new Date(utcDate.getTime() - tzOffset);
    return localTime.toISOString().slice(0, -1).substring(0, 10);
  }
  public isoToCalendarDate(isoDate: string): string {
    if (!isoDate || typeof isoDate !== 'string' || isoDate.length < 10) {
      isoDate = this.utcDateToIso(new Date());
    }
    return isoDate.substring(0, 10);
  }
  public utcDateToIso( utcDate: Date): string {
    return formatISO(utcDate);
  }
  public isoToStrDate( isoDate: string, isWeek:boolean = false, isJapanese:boolean = false ) : string {
    return this.utcToStrDate( this.isoToUtcDate(isoDate), isWeek, isJapanese );
  }
  public isoToStrDateHM( isoDate: string, isWeek:boolean = false, isJapanese:boolean = false ) : string {
    return this.utcToStrDateHM( this.isoToUtcDate(isoDate), isWeek, isJapanese );
  }
  public isoToStrMonthDay( isoDate: string ) : string {
    return this.utcToStrMonthDay( this.isoToUtcDate(isoDate) );
  }
  public isoToStrHM( isoDate: string ) : string {
    return this.utcToStrHM( this.isoToUtcDate(isoDate) );
  } 
  //===========================================================================  
  public isoToDateTime(isoDate: string): string {
    const yearMonthStr = isoDate.slice(0, 10);
    return `${yearMonthStr}T00:00:00`;
  }
  //===========================================================================  
}

