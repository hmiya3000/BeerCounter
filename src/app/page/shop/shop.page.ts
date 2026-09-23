import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonRow, IonCol, IonCard, IonGrid, IonButton, IonButtons, IonSpinner, IonItem, IonSplitPane, IonMenu, IonList, IonLabel, IonRange, IonIcon } from '@ionic/angular/standalone';
import { DrinkService } from 'src/app/service/features/drink-service';
import { Nav, Num, Str, Util } from 'src/app/utils/util';
import { Router } from '@angular/router';
import { SharedModalComponent } from 'src/app/components/shared-modal/shared-modal.component';
import { WindowService } from 'src/app/service/window-service';
import { addIcons } from 'ionicons';
import { beer, globeOutline, searchOutline, informationCircle, water } from 'ionicons/icons';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { FreetextInputComponent } from 'src/app/components/freetext-input/freetext-input.component';
import { InputService } from 'src/app/service/input-service';
import { IMenuItem, MenuService } from 'src/app/service/features/menu-service';
import { PartyService } from 'src/app/service/features/party-service';
import { HealthService } from 'src/app/service/features/health-service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
  standalone: true,
  imports: [IonIcon, IonRange, IonLabel, IonList, IonSplitPane, IonItem, IonSpinner, IonButtons, IonButton, IonGrid, IonCard, IonCol, IonRow, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, SharedModalComponent, IonMenu,FreetextInputComponent, ]
})
export class ShopPage implements OnInit {

  @ViewChild('rightContent', { static: false }) rightContent!: IonContent;

  public coef:number  = 0;
  public readonly Nav = Nav;
  public menuShop:any;
  public menuHome:any;
  public isLoaded: boolean                = false;

  public isOpenAddMenu:boolean            = false;
  public isOpenInfomation:boolean         = false;
  public isBooted                         = false;
  public  activeIndex:number              = 0;
  private isManualScrolling               = false;
  //---
  public  isOpenOrderConfirm:boolean      = false;
  public  selectItem:IMenuItem | null     = null;
  //---
  public  alContent1000Curr:number        = 0;
  public  alMin1000:number                = 0;
  public  alMax1000:number                = 0;
  public  alStep1000:number               = 0;
  public  strAlContentInit:string         = '';
  //---
  public  mlCurr:number                   = 0;
  public  mlMin:number                    = 0;
  public  mlMax:number                    = 0;
  public  mlStep:number                   = 0;
  public  strMlInit:string                = '';
  public  strTips:string                  = '';
  //---
  public  drinkContentCurr:number         = 0;


  //===========================================================================
  constructor(
    private cdr: ChangeDetectorRef,
    public  router: Router,
    private inputSvc: InputService,
    private healthSvc: HealthService,
    private menuSvc: MenuService,
    private partySvc: PartyService,
    private drinkSvc: DrinkService,
    private windowSvc: WindowService,
  ) {
    addIcons({beer,searchOutline,water,informationCircle,globeOutline});    
  }
  async ngOnInit() {
    this.partySvc.readBackup();
    if (!this.healthSvc.isDataInputDone){
      Nav.to(this.router, 'first');
    }
    if (!this.isLoaded){
//      this.modalOpen('infomation');
    }
  }
  ionViewWillEnter() {
    this.partySvc.readBackup();
    this.menuSvc.menuLoaded$.subscribe((loaded: boolean) => {
      this.isLoaded = loaded;
      if (loaded) {
        this.initParam();
//        this.modalOpen('infomation');
      }
    });
  }
  //===========================================================================
  public get strChangeButton(): string {
    return this.menuSvc.isShop ? '→宅飲み' : '→居酒屋'
  }
  public get strTitle(): string {
    return this.menuSvc.isShop ?'居酒屋メニュー' :  '宅飲みメニュー'
  }
  public get menuList() : any[] {
    if (this.menuSvc.isShop){
      return this.menuShop;
    } else {
      return this.menuHome;
    }
  }
  public strItemMl( _item:IMenuItem ): string {
    return Str.float( _item['ml'], APP_CONFIG.DEC_PLACE_DEF ) + 'ml';
  }
  public strAlcohol( _item:IMenuItem){
    return this.drinkSvc.calcAlcohol(_item['alContent'], _item['ml'], this.menuSvc.getCoef(_item.ID),  ) + 'g'
  }
  public get strAlcoholCurr(): string{
    if (this.selectItem){
     return this.drinkSvc.calcAlcohol(this.alContent1000Curr/1000,this.mlCurr, this.menuSvc.getCoef(this.selectItem.ID),  ) + 'g'
    }
    return '? g'
  }
  public get strTitleOrderConfirm(): string {
    if (this.selectItem){
      return this.selectItem['分類'];
    } else {
      return '';
    }
  }
  public colorAlcohol( _item:IMenuItem): {bgColor:string, textColor:string}{
    const _alc:number = this.drinkSvc.calcAlcohol(_item['alContent'], _item['ml'], this.menuSvc.getCoef(_item.ID),  );
    return this.drinkSvc.colorAlcLevel(_alc);
  }
  public get colorAlcoholCurr(): {bgColor:string, textColor:string}{
    if (this.selectItem){
      const _alc:number = this.drinkSvc.calcAlcohol(this.alContent1000Curr/1000, this.mlCurr, this.menuSvc.getCoef(this.selectItem.ID),  );
      return this.drinkSvc.colorAlcLevel(_alc);
    }
    return this.drinkSvc.colorAlcLevel(0);
  }
  //---
  public get strDrinkContent(): string {
    if (this.selectItem){
      return Str.float(this.mlCurr * this.menuSvc.getCoef(this.selectItem.ID), 0 );
    } else {
      return 'xx'
    }
  }
  public get strAlContentCurr(): string {
    return Str.float(this.alContent1000Curr/10 , APP_CONFIG.DEC_PLACE_DEF );
  }
  public initAlContent(){
    if (this.selectItem){
      this.alContent1000Curr  = this.selectItem.alContent *1000
    }
  }
  public get strMlCurr(): string {
    return Str.float(this.mlCurr , 0 );
  }
  public initMl(){
    if (this.selectItem){
      this.mlCurr  = this.selectItem.ml;
    }
  }
  //---
  public getCoef100( _itemId:number){
    return Math.floor( this.menuSvc.getCoef(_itemId) * 100);
  }
  public strCoef( _itemId:number): string{
    const _coef:number = this.menuSvc.getCoef(_itemId);
    if (_coef === 1){
      return '満杯';
    } else {
      return Math.floor( _coef * 100) + '%';
    }
  }
  public initCoef( _item:IMenuItem){
    this.menuSvc.setCoef(_item.ID, _item['coef'])
  }
  //===========================================================================
  private initParam(){
    this.menuShop = this.menuSvc.menu.find(g => g.daiBunrui === '店')?.bunrui;
    this.menuHome = this.menuSvc.menu.find(g => g.daiBunrui === '家')?.bunrui;
  }
  //===========================================================================
  public modalOpen( key:string ){
    this.windowSvc.hideAdBannerByModal();
    if ( key === 'addMenu'){
      this.isOpenAddMenu        = true;
    } else if ( key === 'orderConfirm'){
      this.isOpenOrderConfirm   = true;

    } else if ( key === 'infomation'){
      this.isOpenInfomation     = true;
    }
  }
  public modalConfirm( isConfirm:boolean, key:string ){
    if ( key === 'addMenu'){
      this.isOpenAddMenu        = false;

    } else if ( key === 'orderConfirm'){
      this.isOpenOrderConfirm   = false;
      if (isConfirm){
        this.fixOrder();
      }

    } else if ( key === 'infomation'){
      this.isOpenInfomation     = false;
    }
    if(!this.isOpenAddMenu && !this.isOpenOrderConfirm && !this.isOpenInfomation){
      this.windowSvc.resumeAdBannerByModal();
    }
  }
  public modalCancel(){
    this.isOpenAddMenu        = false;
    this.isOpenInfomation     = false;
    this.isOpenOrderConfirm   = false;
    this.windowSvc.resumeAdBannerByModal();
    
  }
  public onIonRange(ev:any, type:string, key:string, _itemId:number){
    if (key === 'coef'){
      const _coef100:number = ev.detail.value;
      this.inputSvc.onIonRange(_coef100,      type, _itemId, (val) => this.upudateCoef(val,_itemId), this.cdr);

    } else if ( key === 'alContent'){
      const _alContent1000:number = ev.detail.value;
      this.inputSvc.onIonRange(_alContent1000, type, _itemId, (val) => this.upudateAlContent(val,_itemId), this.cdr);

    } else if ( key === 'ml'){
      const _ml:number = ev.detail.value;
      this.inputSvc.onIonRange(_ml, type, _itemId, (val) => this.upudateMl(val,_itemId), this.cdr);

    }
  }
  private upudateCoef( _coef100:number, _itemId:number){
    this.menuSvc.setCoef(_itemId, _coef100/100);
  }
  private upudateAlContent( _alContent1000:number, _itemId:number){
    this.alContent1000Curr  = _alContent1000;
  }
  private upudateMl( ml:number, _itemId:number){
    this.mlCurr             = ml;
  }
  //===========================================================================
  public changeMenu(){
    this.menuSvc.changeShop()
  }
  public scrollToMenu( _idx:number){
    // ターゲットとなるHTML要素を取得
    const element = document.getElementById(`menu-${_idx}`);
    
    if (element && this.rightContent) {
      this.isManualScrolling = true;
      this.activeIndex = _idx;
      this.rightContent.scrollToPoint(0, element.offsetTop, 500).then(() => {
        // スクロールアニメーション完了後にフラグを解除（少し猶予を持たせる）
        setTimeout(() => {
          this.isManualScrolling = false;
        }, 100);
      });
    }
  }
  public onRightScroll(event: CustomEvent) {
    if (this.isManualScrolling) return;
    const scrollTop = event.detail.scrollTop + 20;
    for (let i = this.menuList.length - 1; i >= 0; i--) {
      const element = document.getElementById(`menu-${i}`);
      if (element) {
        if (scrollTop >= element.offsetTop) {
          this.activeIndex = i;
          break; // 一番下の該当要素を見つけたらループを抜ける
        }
      }
    }
  }  
  public selectDrink( _itemId:number){

    const _item = this.menuSvc.getMenuItem(_itemId);
    if (_item !== null){
      this.selectItem = _item;
      //---
      this.alContent1000Curr    = Math.floor( this.menuSvc.getAlContent(this.selectItem.ID) * 1000);
      this.alMin1000            = this.selectItem.alMin*1000;
      this.alMax1000            = this.selectItem.alMax*1000;
      this.alStep1000           = this.selectItem.alStep*1000;
      this.strAlContentInit     = Str.float(this.selectItem.alContent*100, APP_CONFIG.DEC_PLACE_DEF)+'度'
      //---
      const { range:_mlRange, step:_mlStep} = this.menuSvc.getMlRangeStep(this.selectItem.ml);
      this.mlStep               = _mlStep;
      this.mlCurr               = this.selectItem.ml;
      this.mlMin                = this.selectItem.ml - _mlRange;
      this.mlMax                = this.selectItem.ml + _mlRange;
      this.strMlInit            = this.selectItem.ml + 'ml';
      this.strTips              = this.selectItem.tips;
      this.modalOpen('orderConfirm');
    }
  }
  private async fixOrder(){
    if (this.selectItem !== null){
      this.menuSvc.setAlContent(this.selectItem.ID, this.alContent1000Curr/1000);
      const _coef       = this.menuSvc.getCoef(this.selectItem.ID);
      const _alContent  = Num.float(this.alContent1000Curr/1000, APP_CONFIG.DEC_PLACE_DEF+2);
      const _ml         = Num.float(this.mlCurr, 0);
      const isAdd       = await this.partySvc.addDrink( this.selectItem.name, this.selectItem.glass, _alContent, _ml, _coef, new Date() );
      if (isAdd){
        setTimeout(() => {
          Nav.to(this.router, 'tab-party/order');
        }, 100);
      }
    }
  }
  public async openBrowser( key:string){
    if (this.selectItem !== null){
      let _url:string = 'https://www.google.com/search?q=';
      if ( key === 'alcohol'){
        _url  = _url  + this.selectItem.name + '+アルコール度数';

      } else if ( key === 'glass'){
        _url  = _url  + this.selectItem.glass + '+容量+' + this.selectItem.name + (this.menuSvc.isShop ? '+居酒屋' : '');

      }
      await Util.openExtBrowser(_url);
    }
  }
  //===========================================================================



}
