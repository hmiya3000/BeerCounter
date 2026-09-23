import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonGrid, IonRow, IonCol, IonButton, IonDatetime, IonLabel, IonCard, IonLoading, IonRange } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { square, timeOutline, trash, calendarOutline, calendarNumberOutline, documentTextOutline, beer,arrowDownOutline,arrowUpOutline, shareSocialOutline, wine, water } from 'ionicons/icons';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { Drink } from 'src/app/class/drink';
import { IDrink } from 'src/app/interface/drink';
import { Str, Util } from 'src/app/utils/util';
import { DateService } from 'src/app/service/date-service';
import { DrinkService, IDisplayDrink, ITipsBloodAlcohol} from 'src/app/service/features/drink-service';
import { AlertService } from 'src/app/service/alert-service';
import { WindowService } from 'src/app/service/window-service';
import { ChartService } from 'src/app/service/chart-service';
import { SharedModalComponent } from 'src/app/components/shared-modal/shared-modal.component';
import { InlineDatetimeComponent } from 'src/app/components/inline-datetime/inline-datetime.component';
import { ChartComponent } from 'src/app/components/chart/chart.component';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { InputService } from 'src/app/service/input-service';
import { IDisplayParty, ISummaryDisplayData, PartyService, SummaryDisplayData } from 'src/app/service/features/party-service';
import { MenuService } from 'src/app/service/features/menu-service';
import { HealthService } from 'src/app/service/features/health-service';
import { DiaryService } from 'src/app/service/features/diary-service';
import { FreetextInputComponent } from 'src/app/components/freetext-input/freetext-input.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [IonRange, IonLoading, IonCard, IonLabel, IonDatetime, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonItem, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, SharedModalComponent, IonGrid, IonRow, IonCol, ChartComponent, IonButton, InlineDatetimeComponent,FreetextInputComponent ]
})
export class CalendarPage implements OnInit {

  @ViewChild('shareTarget', { read: ElementRef }) shareTarget!: ElementRef;
  @ViewChild('slidingListDrink') slidingListDrink!: HTMLIonListElement;
  @ViewChild('partyDatetime', { read: ElementRef }) datetimeEl!: ElementRef;

  public  displayArrPartyAtYearMonth: IDisplayParty[] = [];
  public  displayArrDrinkCurr: IDisplayDrink[]        = []; // 今回の飲み会用
  public  summaryDisplay: ISummaryDisplayData         = new  SummaryDisplayData()
  private arrDrinkAtParty: IDrink[]         = [];
  public  isLoaded:boolean                  = false;
  public  chartHeight:number                = 200;
  public  isRevArrPartyAtYearMonth:boolean  = true;
  //---
  public  isOpenPartyDetail:boolean         = false;
  public  partyMemo:string                  = '';
  //---
  public  isOpenAlcoholLevel:boolean        = false;
  //---
  public  isOpenDrinkDetail:boolean         = false;
  public  curDrink:IDrink                   = new Drink();
  public  isEditDrink:boolean               = false;
  //---
  public  utcDateCurr:Date                  = new Date();

  public  targetPartyIndex:number           = 0;
  private arrPartyLengthCur:number          = 0;
  //---
  public  calendarDate: string              = this.dateSvc.utcDataToCalendarDate( new Date);
  public  markerDayDrinked: any[]           = [];
  public  isNowYeatMonth:boolean            = false;
  private observer?: MutationObserver;
  public  visibleYear: number               = new Date().getFullYear();
  public  visibleMonth: number              = new Date().getMonth() + 1;  
  private visibleTime:string                = this.dateSvc.nowDate().isoDate;
  private dayDrinked:number                 = 0;
  private dayNoDrinked:number               = 0;
  private sumAlcoholMonth:number            = 0;
  private sumAlcoholMonthEst:number         = 0;
  private aveAlcohol:number                 = 0;
  //---
  public  isSharing:boolean                 = false;
  public  clonedChartImgSrc: string | null  = null;
  //---
  public  alContent1000Curr:number        = 0;
  public  alMin1000:number                = 0;
  public  alMax1000:number                = 0;
  public  alStep1000:number               = 0;
  public  mlCurr:number                   = 0;
  public  mlMin:number                    = 0;
  public  mlMax:number                    = 0;
  public  mlStep:number                   = 0;
  public  coef100Curr:number              = 0;
  //===========================================================================
  constructor(
    private cdr: ChangeDetectorRef,
    public  chartSvc: ChartService,
    private diarySvc: DiaryService,
    private drinkSvc: DrinkService,
    private alertSvc: AlertService,
    private dateSvc: DateService,
    private healthSvc: HealthService,
    private inputSvc: InputService,
    private menuSvc: MenuService,
    private partySvc: PartyService,
    private windowSvc: WindowService,
  ) {
    addIcons({calendarNumberOutline,documentTextOutline,shareSocialOutline,beer,timeOutline,trash,wine,water,calendarOutline,square,arrowDownOutline,arrowUpOutline});    
  }
  ngOnInit() {
    this.partySvc.readBackup();
    this.updatePartyAll();
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
  }
  ngAfterViewInit() {
    // 2. Ionicのレンダリング完了をわずかに待ってから監視を開始
    setTimeout(() => {
      this.startTrackingMonthYear();
    }, 500);
  }
  ngOnDestroy() {
    // 画面を離れるときは監視を止めてメモリを解放
    if (this.observer) this.observer.disconnect();
  }  
  //===========================================================================
  public get isDrinkStart() : boolean {
    return this.arrDrinkAtParty.length > 0 ? true : false;
  }
  public get strCurPartyDate() : string{
    const targetParty = this.partySvc.partyInfo(this.targetPartyIndex);
    if (targetParty.time !== ''){
      return this.dateSvc.isoToStrDate(targetParty.time);
    } else {
      return ''
    }
  }
  public get hasValidParty(): boolean {
    const targetParty = this.partySvc.partyInfo(this.targetPartyIndex);
    return targetParty.time !== '' ? true :false;

  }
  public get strTitleCurDrinkList() : string{
    const targetParty = this.partySvc.partyInfo(this.targetPartyIndex);
    if (targetParty.time !== ''){
      return  'ドリンクリスト at ' + this.dateSvc.isoToStrDateHM(targetParty.time) +'〜';
    } else {
      return '飲酒なし'
    }
  }
  public get strAveAlcoholInMonth() : string {
    if (this.aveAlcohol){
      return Str.float(this.aveAlcohol, APP_CONFIG.DEC_PLACE_DEF);
    } else {
      return '--'
    }
  }
  public get strAveAlcoholUnitInMonth() : string {
    if (this.aveAlcohol){
      return Str.float(this.drinkSvc.calcAlcoholUnit(this.aveAlcohol), APP_CONFIG.DEC_PLACE_DEF);
    } else {
      return '--'
    }
  }
  public strHM( _isoTime:string) : string {
    return this.dateSvc.isoToStrHM(_isoTime);
  }
  public get colorbloodAlcoholAve(): {bgColor:string, textColor:string}{
    const _aveAlcohol = this.aveAlcohol ? this.aveAlcohol : 0;
    const retVal  = this.healthSvc.strBloodAlcohol(_aveAlcohol,this.visibleTime);
    return { bgColor:retVal.bgColor, textColor:retVal.textColor};
  }
  //---
  public strAlcohol(_drink:IDrink): string {
    return this.drinkSvc.strAlcohol(_drink);
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
  public get strSelectCalendar(): string {
    return this.dateSvc.isoToStrDate(this.calendarDate, true, true);
  }
  public get strCalendarYearMonth(): string{
    let _retStr:string = this.visibleYear + '年' + this.visibleMonth + '月';
    const retval = this.dateSvc.nowDate()
    if (retval.year === this.visibleYear && retval.month === this.visibleMonth){
      _retStr = _retStr + ' (〜' +  retval.date + '日)'
    }
    return _retStr;
  }
  //---
  public get strSumAlcoholMonth(): string {
    return Str.float( this.sumAlcoholMonth , APP_CONFIG.DEC_PLACE_DEF );
  }
  public get strSumAlcoholUnitMonth(): string {
    return Str.float(this.drinkSvc.calcAlcoholUnit(this.sumAlcoholMonth), APP_CONFIG.DEC_PLACE_DEF);
  }
  public get strEstSumAlcoholMonth(): string {
    return Str.float( this.sumAlcoholMonthEst , APP_CONFIG.DEC_PLACE_DEF );
  }
  public get strEstSumAlcoholUnitMonth(): string {
    return Str.float(this.drinkSvc.calcAlcoholUnit(this.sumAlcoholMonthEst), APP_CONFIG.DEC_PLACE_DEF);
  }

  public get strDayDrinked(): string {
    return this.dayDrinked + '';
  }
  public get strDayNoDrinked(): string {
    return this.dayNoDrinked + '';
  }
  public get strRateDayNoDrinked(): string {
    return Str.rate( this.dayNoDrinked/(this.dayDrinked+this.dayNoDrinked),0)
  }
  public get isValidYearMonth(): boolean {
    return this.drinkSvc.isValidYearMonth(this.visibleYear,this.visibleMonth);
  }
  public get arrTipsBloodAlcohol(): ITipsBloodAlcohol[] {
    return this.drinkSvc.arrTipsBloodAlcohol
  }
  //===========================================================================
  private initParam(){
    this.updatePartyAll();
    this.updateYearMonth();
    this.selectToday();
  }
  //===========================================================================
  public modalOpen( key:string ){
    this.windowSvc.hideAdBannerByModal();
    if ( key === 'partyDetail'){
      this.updatePartyCur();
      this.arrPartyLengthCur      = this.partySvc.arrParty.length;
      this.isOpenPartyDetail      = true;

    } else if ( key === 'drinkDetail'){
      this.utcDateCurr            = this.dateSvc.isoToUtcDate(this.curDrink.time);
      this.isOpenDrinkDetail      = true;

    } else if ( key === 'alcoholLevel'){
      this.isOpenAlcoholLevel     = true;

    }
  }
  public modalConfirm( isConfirm:boolean, key:string ){
    if ( key === 'partyDetail'){
      this.updatePartyAll();
      this.updateYearMonth();
      this.isOpenPartyDetail      = false;

    } else if ( key === 'drinkDetail'){
      if (isConfirm){
        this.setDrinkDetailCurr();
        this.updatePartyCur();
        this.updatePartyAll();
      }
      this.isEditDrink            = false;
      this.isOpenDrinkDetail      = false;

    } else if ( key === 'alcoholLevel'){
      this.isOpenAlcoholLevel     = false;

    }
    if(!this.isOpenPartyDetail && !this.isOpenDrinkDetail && !this.isOpenAlcoholLevel){
      this.windowSvc.resumeAdBannerByModal();
    }
  }
  public modalCancel(){
    this.isOpenPartyDetail        = false;
    this.isOpenDrinkDetail        = false;
    this.isOpenAlcoholLevel       = false;
    this.windowSvc.resumeAdBannerByModal();
  }
  public enableHeaderButton( isForward:boolean, key:string): boolean{
    if (key === 'partyDetail'){
      if (this.targetPartyIndex >= 0){
        if (isForward){
          return ( this.targetPartyIndex <  this.partySvc.arrParty.length-1) ? true : false;
        } else {
          return ( this.targetPartyIndex >  0 ) ? true : false;
        }
      }
    } else if ( key === 'drinkDetail'){
      const _curId:number   = this.curDrink.id
      const _curIdx:number  = this.drinkSvc.arrDrink.findIndex( drink => drink.id == _curId);
      if (_curIdx >= 0){
        if (isForward){
          return (  _curIdx <  this.drinkSvc.arrDrink.length-1) ? true : false;
        } else {
          return ( _curIdx >  0 ) ? true : false;
        }
      }
    }
    return false;
  }
  public modalHeaderClick( ev:any, key:string){
    const _dir:number = ev.dir;
    if (key === 'partyDetail'){
      if (this.targetPartyIndex > 0){
        if ( _dir <  0){
          if ( this.targetPartyIndex > 0){
            this.targetPartyIndex--;
            this.selectParty(this.targetPartyIndex);
            this.updatePartyCur();
          }
        } else if ( _dir > 0){
          if ( this.targetPartyIndex <  this.partySvc.arrParty.length-1){
            this.targetPartyIndex++;
            this.selectParty(this.targetPartyIndex);
            this.updatePartyCur();
          }
        }
      }
    } else if ( key === 'drinkDetail'){
      const _curId:number   = this.curDrink.id
      const _curIdx:number  = this.drinkSvc.arrDrink.findIndex( drink => drink.id == _curId);
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
    this.slidingListDrink.closeSlidingItems();
  }
  public onIonRange(ev:any, type:string, key:string){
    if (key === 'alContent'){
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
  private upudateAlContent( _alContent1000:number, _itemId:number){
    this.alContent1000Curr  = _alContent1000;
  }
  private upudateMl( ml:number, _itemId:number){
    this.mlCurr             = ml;
  }
  private upudateCoef( _coef100:number, _itemId:number){
    this.coef100Curr        = _coef100;
  }

  //===========================================================================
  public async openBrowser(_targetUrl:string){
    await Util.openExtBrowser(_targetUrl);
  }
  //===========================================================================
  public selectToday(){
    this.setCalendarDate(new Date);
    this.cdr.detectChanges();
  }
  public onIonDateTime(event: any, type:string, key:string): void {
    if (key === 'monthDrink'){
      if (type === 'ionChange'){
        const selectedIso = event.detail.value;
        if (!selectedIso) return;
        console.log('[Calendar] 日付がタップされました:', selectedIso);
        this.setCalendarDate(new Date(selectedIso));
        this.cdr.detectChanges(); // 画面の文字を1ナノ秒で世代交代させる
        if (this.targetPartyIndex >= 0){
          this.modalOpen('partyDetail');
        }
      }
    }
  }
  public selectPartyAndModalOpen( _partyId:number){
    const _idx:number = this.partySvc.arrParty.findIndex(party => party.id === _partyId);
    this.selectParty(_idx);
    this.modalOpen('partyDetail');
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
  //---
  private selectParty( _idx:number){
    this.targetPartyIndex   = _idx;
    if ( 0 <= _idx && _idx < this.partySvc.arrParty.length){
      const partyTime:string  = this.partySvc.arrParty[this.targetPartyIndex].time;
      this.calendarDate = this.dateSvc.isoToCalendarDate(partyTime);
      this.partyMemo    = this.diarySvc.getContent(partyTime);
    } else {
      this.partyMemo    = '';      
    }
  }
  private setCalendarDate( utcDate:Date): void {
    this.calendarDate = this.dateSvc.utcDataToCalendarDate( utcDate);
    const _selectedIdx  = this.partySvc.arrParty.findIndex( party =>  this.dateSvc.isoToCalendarDate(party.time) === this.calendarDate );
    this.targetPartyIndex   = _selectedIdx;
  }
  //===========================================================================
  public async openChangeDrinkTime(_drinkId:number, isTemp:boolean, _is12hour:boolean ){
    const _targetDrink  = this.drinkSvc.curDrink(_drinkId);
    const _utcDate      = this.dateSvc.isoToUtcDate(_targetDrink.time);
    const _placeholder  = this.drinkSvc.strXXXXPlaceholder(_utcDate);
    const _message      = this.drinkSvc.strXXXXMessage(_utcDate,_is12hour);
    this.slidingListDrink.closeSlidingItems();
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
        const _newTime = this.drinkSvc.changeHHMM(newHHMMValue, _targetDrink.time, false );
        if (_newTime !== ''){
          if (isTemp){
            const _newUtcDate = this.dateSvc.isoToUtcDate(_newTime);
            this.utcDateCurr  = this.dateSvc.setHmsToUtcDate( this.utcDateCurr, _newUtcDate.getHours(),_newUtcDate.getMinutes() );

          } else {
            _targetDrink.time     = _newTime;
            this.partySvc.saveRecord();
            if (this.arrPartyLengthCur !== this.partySvc.arrParty.length){
              this.arrPartyLengthCur  = this.partySvc.arrParty.length;
              this.updatePartyAll();
              if (this.targetPartyIndex > this.partySvc.arrParty.length-1){
                this.targetPartyIndex = this.partySvc.arrParty.length-1;
              }
              this.selectParty(this.targetPartyIndex);
            }
            this.updatePartyCur();
          }
          this.cdr.detectChanges();
        }
      }
    }, 300);
  }
  public deleteDrink( _drinkId:number){
    this.partySvc.deleteDrink(_drinkId);
    this.slidingListDrink.closeSlidingItems();
    setTimeout(() => {
      if (this.arrPartyLengthCur !== this.partySvc.arrParty.length){
        this.arrPartyLengthCur  = this.partySvc.arrParty.length;
        this.updatePartyAll();
        if (this.targetPartyIndex > this.partySvc.arrParty.length-1){
          this.targetPartyIndex = this.partySvc.arrParty.length-1;
        }
        this.selectParty(this.targetPartyIndex);
      }
      this.updatePartyCur();
    }, 200);       
  }
  public changeEditDrink(){
    this.isEditDrink  = !this.isEditDrink
  }
  //===========================================================================
  private startTrackingMonthYear() {
    const datetimeNative = this.datetimeEl.nativeElement;
    if (!datetimeNative || !datetimeNative.shadowRoot) return;
    const monthYearButton = datetimeNative.shadowRoot.querySelector('.calendar-month-year');
    if (!monthYearButton) return;
    this.parseAndSetMonthYear(monthYearButton.textContent);
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          const updatedText = monthYearButton.textContent;
          this.parseAndSetMonthYear(updatedText);
        }
      }
    });
    this.observer.observe(monthYearButton, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  private parseAndSetMonthYear(text: string | null) {
    if (!text) return;

    const matches = text.match(/\d+/g);
    if (matches && matches.length >= 2) {
      this.visibleYear    = parseInt(matches[0], 10);
      this.visibleMonth   = parseInt(matches[1], 10);
      const _baseDate     = new Date();
      this.visibleTime    = this.dateSvc.utcDateToIso(this.dateSvc.setYmdToUtcDate(_baseDate,  this.visibleYear, this.visibleMonth, 1));
      if (_baseDate.getFullYear() === this.visibleYear && _baseDate.getMonth()+1 === this.visibleMonth){
        this.isNowYeatMonth = true;
      } else {
        this.isNowYeatMonth = false;
      }
      console.log(`【表示変更を検知】現在見ているのは: ${this.visibleYear}年 ${this.visibleMonth}月 です`);
      this.updateYearMonth();
    }
  }
  public toggleSortOrder(): void {
    this.isRevArrPartyAtYearMonth   = !this.isRevArrPartyAtYearMonth;
    this.displayArrPartyAtYearMonth = [...this.displayArrPartyAtYearMonth.reverse()]
  }  
  //===========================================================================
  async captureAndShare() {
    // 二重タップ防止とローディング表示
    this.isSharing = true;

    try {
      // 1. 表側の画面（モーダル内のどこか）にある実際のグラフの <canvas> を探して画像化する
      // ※ ionic のラッパーがあるため、document全体からcanvasを探すのが最も確実です
      const canvasElement = document.querySelector('app-shared-modal canvas') as HTMLCanvasElement;
      
      if (canvasElement) {
        this.clonedChartImgSrc = canvasElement.toDataURL('image/png');
      }

      // Angularが隠しカード内の <img> にデータを反映するのを確実に待つ
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. 完全に独立して隠してある #shareTarget（500x500のカード）を直接パシャリ！
      const targetDOM = this.shareTarget.nativeElement;
      const canvas = await html2canvas(targetDOM, {
        useCORS: true,
        scale: 2, // 2倍高画質
        backgroundColor: null
      });

      // 3. キャプチャが終わったら一時的なグラフ用Base64変数をクリア
      this.clonedChartImgSrc = null;

      // 4. 画像ファイルとして書き出し
      const cardBase64 = canvas.toDataURL('image/png');
      const rawBase64 = cardBase64.split(',')[1]; 
      const fileName = `drinking-summary-${Date.now()}.png`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: rawBase64, // これで型が string になり、エラーが解消されます
        directory: Directory.Cache
      });

      // 5. シェア！
      await Share.share({
        title: `${this.strCurPartyDate} の飲み会サマリー 🍻`,
        text: `${this.strCurPartyDate} の飲み会記録です！ #飲み会記録`,
        files: [savedFile.uri],
        dialogTitle: '飲み会記録をシェア',
      });

    } catch (error) {
      console.error('シェア処理中にエラーが発生しました:', error);
    } finally {
      this.isSharing = false;
    }
  }
  //===========================================================================
  private updatePartyAll(){
    this.updateCalendarMarker();
  }
  private updateCalendarMarker(): void {
    this.markerDayDrinked = [];
    this.partySvc.arrParty.forEach(party => {
      if (!party.time) return;
      const markCalendarDate = this.dateSvc.isoToCalendarDate(party.time); // ➔ "2026-08-19"
      const bac   = this.healthSvc.strBloodAlcohol(party.sumAlcohol,party.time)
      this.markerDayDrinked.push({
        date:             markCalendarDate, // 🎯 マークをつけたい日付（例: "2026-08-19"）
        textColor:        bac.textColor,    // ✍️ その日の数字（文字）の色（白が一番見やすいです）
        backgroundColor:  bac.bgColor
      });
    });
    console.log('[CalendarMarker] 🏆 カレンダーのマーク付き日付を自動生成しました:', this.markerDayDrinked);
  }
  private updateYearMonth(){
    let _sumAlc:number  = 0;
    this.dayDrinked     = 0;
    let _prevDay        = 0;
    const arrPartyAtYearMonth       = this.partySvc.arrPartyAtYearMonth(this.visibleYear,this.visibleMonth);    
    this.displayArrPartyAtYearMonth = this.partySvc.convertToDisplayArrParty(arrPartyAtYearMonth, this.targetPartyIndex, this.isRevArrPartyAtYearMonth);
    for ( let p of arrPartyAtYearMonth){
      _sumAlc = _sumAlc + p.sumAlcohol;
      const _curDay     = this.dateSvc.isoToUtcDate(p.time).getDate();
      if (_prevDay !== _curDay){
        this.dayDrinked++;
        _prevDay        = _curDay;
      }      
    }
    this.sumAlcoholMonth    = _sumAlc;
    const daysInMonth       = this.dateSvc.getDaysInMonth(this.visibleYear,this.visibleMonth, true);
    this.dayNoDrinked       = daysInMonth -  this.dayDrinked;
    this.aveAlcohol         = this.sumAlcoholMonth / this.dayDrinked;
    //---
    const daysInMonthEnd    = this.dateSvc.getDaysInMonth(this.visibleYear,this.visibleMonth, false);
    if (daysInMonth > 14){
      this.sumAlcoholMonthEst = this.sumAlcoholMonth * daysInMonthEnd / (this.dayDrinked+this.dayNoDrinked);
    } else {
      const retVal            = this.partySvc.calcRateDrinkedDay(this.dateSvc.nowDate().isoDate, 14);
      this.sumAlcoholMonthEst = this.sumAlcoholMonth + (daysInMonthEnd - daysInMonth) * retVal.rateDrinkedDay * this.aveAlcohol
    }
  }
  private updatePartyCur(){
    this.arrDrinkAtParty      = this.partySvc.arrDrinkAtParty(this.targetPartyIndex, this.drinkSvc.arrDrink);
    this.displayArrDrinkCurr  = this.drinkSvc.convertToDisplayArrDrink(this.arrDrinkAtParty, false);
    this.summaryDisplay       = this.partySvc.convertToPartySummary(this.targetPartyIndex);
    this.updateChart()
  }
  private updateChart(){
    this.updateChartDrinkTime();
    this.cdr.detectChanges();
  }
  private updateChartDrinkTime(){
    if (this.arrDrinkAtParty.length !== 0){
      const _chartId      = 'drinkTime'
      const retVal        = this.drinkSvc.makeDrinkChartData(this.arrDrinkAtParty);
      const yLinesSetting = this.healthSvc.makeDrinkChartYLineSetting(retVal.alcoholMax,this.arrDrinkAtParty[0].time );
      const _max:number = yLinesSetting[yLinesSetting.length-1].yValue;
      
      this.chartSvc.updateChartData(_chartId, 'scatter', [retVal.alcohol], ['摂取アルコール(累積)'], retVal.time);
      this.chartSvc.updateChartOption(_chartId, {labels:retVal.time,axisMode:'time' }, {min:0,max:_max} , true, {targetYLinesSetting:yLinesSetting, targetXLines:[] });
    }
  }
  //===========================================================================
}