import { Component, Input, Output, EventEmitter, OnInit  } from '@angular/core';
import { IonItem, IonIcon, IonLabel, IonPopover, IonDatetime, IonButton, IonInput, IonSegment, IonSegmentButton } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { formatISO, parseISO, set } from 'date-fns';
import { addIcons } from 'ionicons';
import { createOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-inline-datetime',
  templateUrl: './inline-datetime.component.html',
  styleUrls: ['./inline-datetime.component.scss'],
  standalone: true,
  imports: [IonSegmentButton, IonSegment, IonInput, IonButton, IonDatetime, IonPopover, IonLabel, IonIcon,  CommonModule,IonItem]
})
export class InlineDatetimeComponent implements OnInit {

  @Input() triggerId: string = 'datetime-trigger'; // 例: 'ggtp', 'weight'
  @Input() baseUtcDate: any;

  @Output() onDateConfirmed = new EventEmitter<Date>();

  public  initialCalMonth: string = '';
  public  isDatetimeRendered: boolean = true;
  public  datetimeMode: 'calendar' | 'input' = 'calendar';
  private lastSelectedDay: string = '';
  constructor() {
    addIcons({calendarOutline,createOutline});    
  }
  ngOnInit() {
    this.syncInitialMonth();
  }
  private syncInitialMonth() {
    if (this.baseUtcDate) {
      // 親の持つDateオブジェクトを元に「その日の00:00:00」のISO文字列を生成
      this.initialCalMonth = this.isoToDateTime(this.utcDateToIso(this.baseUtcDate));
    }
  }
  public prepareCalMonth() {
    this.syncInitialMonth();
    this.datetimeMode = 'calendar';
    if (this.initialCalMonth) {
      this.lastSelectedDay = this.initialCalMonth.slice(8, 10);
    }    
    this.isDatetimeRendered = false;
    setTimeout(() => {
      this.isDatetimeRendered = true;
    }, 0);
  }
  public ionDatetime(ev: any, popover: any) {
    if (ev.target && ev.target.tagName === 'ION-SEGMENT') {
      console.log('🛑 セグメントタブのイベントが混入したため、自動クローズを完全ブロックします。');
      return; 
    }
    if (!ev.detail.value) return;
    console.log(ev)
    const _selectedIsoString = ev.detail.value;
    const currentSelectedDay = _selectedIsoString.slice(8, 10);
    console.log(`📊 前回日: ${this.lastSelectedDay} ➔ 今回日: ${currentSelectedDay}`);
    const _selectedUtcData   = this.isoToUtcDate(_selectedIsoString);
    const retVal             = this.dateInfo(_selectedUtcData);
    const updatedDate = this.setYmdToUtcDate(this.baseUtcDate, retVal.year, retVal.month, retVal.date);
    this.onDateConfirmed.emit(updatedDate);
    if (this.lastSelectedDay !== currentSelectedDay) {
      console.log('✅ カレンダーの「日」が新しくタップされたため、スマートに閉じます。');
      this.lastSelectedDay = currentSelectedDay; // 次回のために保存
      popover.dismiss();                         // ポップオーバーを閉じる
    } else {
      console.log('🔄 年月ホイールの回転、または同じ日付のタップを検知。画面を維持します。');
    }
  }
  public onDirectDateInput(ev: any, popover: any) {
    const rawVal = ev.detail.value || '';
    // 数字以外の文字を完全に排除
    const numVal = rawVal.replace(/\D/g, '');

    // 💡 1. ちょうど8桁になった瞬間だけ処理を実行します
    if (numVal.length === 8) {
      const yearStr  = numVal.slice(0, 4);  // "2026"
      const monthStr = numVal.slice(4, 6);  // "09"
      const dayStr   = numVal.slice(6, 8);  // "04"

      const year  = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day   = parseInt(dayStr, 10);

      // 💡 2. 入力された数字が「実在する正しい日付」かチェック（例: 20261545 などの無効データをガード）
      const testDate = new Date(year, month - 1, day);
      if (
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
      ) {
        console.log(`🎯 有効な8桁入力を検知: ${yearStr}/${monthStr}/${dayStr}`);

        // 💡 3. カレンダーとホイールが認識できる正しいISO文字列形式に変換
        this.initialCalMonth = `${yearStr}-${monthStr}-${dayStr}T00:00:00`;
        // DD変位フィルターが誤爆して閉じないよう、前回選択日を強制上書き
        this.lastSelectedDay = dayStr;

        // 💡 4. 親コンポーネント（メイン画面）へ最新日付を反映（通知）
        const updatedDate = this.setYmdToUtcDate(this.baseUtcDate, year, month, day);
        this.onDateConfirmed.emit(updatedDate);

        // 💡 5. カレンダーとホイールの表示を新しい日付へ「シュパッ」と強制同期（再起動）
        this.isDatetimeRendered = false;
        setTimeout(() => {
          this.isDatetimeRendered = true;
          
          // 💡 6. 【極上のUX】数字入力を終えたら、ユーザーにそれ以上ボタンを押させず自動でポップオーバーを閉じます
          console.log('🎉 8桁入力成功により自動クローズします。');
          popover.dismiss();
        }, 50);

      } else {
        console.warn('⚠️ 入力された数字は存在しない日付です。');
      }
    }
  }  
  public goToCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 今日の「日付」のISO文字列をセットしてカレンダーを強制再起動
    this.initialCalMonth = `${year}-${month}-${day}T00:00:00`;

    this.isDatetimeRendered = false;
    setTimeout(() => {
      this.isDatetimeRendered = true;
    }, 0);
  }
  private utcDateToIso( utcDate: Date): string {
    return formatISO(utcDate);
  }
  private isoToUtcDate( isoDate: string ): Date {
    return parseISO(isoDate);
  }
  private setYmdToUtcDate( basegDate:Date, year:number, month:number, day:number ){
    month  = Math.floor(month);
    month  = month > 12 ? 12 : month;
    month  = month <  1 ?  1 : month;
    const finalDate = set(basegDate, { year: year, month: month-1, date:day})
    return finalDate;
  }
  private isoToDateTime(isoDate: string): string {
    const yearMonthStr = isoDate.slice(0, 10);
    return `${yearMonthStr}T00:00:00`;
  }
  private dateInfo( _utcData:Date): { year:number, month:number, date:number}{
    const _year:number    = _utcData.getFullYear();
    const _month:number   = _utcData.getMonth() + 1;
    const _date:number    = _utcData.getDate();
    return { year:_year, month:_month, date:_date}
  }


}
