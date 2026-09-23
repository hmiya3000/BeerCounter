import { Injectable } from '@angular/core';
import { IDiary } from 'src/app/interface/diary';
import { DateService } from '../infra/date-service';
import { Util } from 'src/app/utils/util';

@Injectable({
  providedIn: 'root',
})
export class DiaryService {

  public  arrDiary:IDiary[]   = [];
  //===========================================================================
  constructor(
    private dateSvc: DateService,
  ){
  }
  //===========================================================================
  public async initialize(){
  }
  public readBackup(){
    if ('arrDiary' in localStorage){
      this.arrDiary         = JSON.parse(localStorage['arrDiary']);
    }
  }
  public clearBackup(){
  }
  public clearBackupDebug(){
    this.clearBackup();
    localStorage.removeItem('arrDiary');
    this.arrDiary   = [];

  }
  //===========================================================================
  public  getContent( _isoDate:string):string {
    const calDate:string  = this.dateSvc.isoToCalendarDate(_isoDate);
    const diary = this.arrDiary.find(item => item.time.startsWith(calDate));
    if (diary){
      return diary.content;
    } else {
      return '';
    }
  }
  public setContent( _content:string, _isoDate:string){
    const calDate:string  = this.dateSvc.isoToCalendarDate(_isoDate);
    const diary = this.arrDiary.find(item => item.time.startsWith(calDate));
    if (diary){
      if (_content.trim() !== ''){
        diary.content = _content;
      } else {
        const deleteId  = diary.id
        this.arrDiary = this.arrDiary.filter(diary => diary.id !== deleteId);
        this.arrDiary = Util.sortAndResetIds(this.arrDiary);
        
      }
      localStorage['arrDiary'] = JSON.stringify(this.arrDiary);
    } else {
      if (_content.trim() !== ''){
        const _newId  = this.arrDiary.length;
        this.arrDiary.push( { id:_newId, time:calDate, content:_content});
        this.arrDiary = Util.sortAndResetIds(this.arrDiary);
        localStorage['arrDiary'] = JSON.stringify(this.arrDiary);
      }
    }
  }
  public  getContentLast( pvevCount:number):string {
    if (this.arrDiary.length > pvevCount ){
      return this.arrDiary[this.arrDiary.length - 1 - pvevCount].content;
    } else {
      return '';
    }
  }
  //===========================================================================
}