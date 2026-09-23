import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonItem, IonGrid, IonRow, IonCol, IonRadio, IonRadioGroup, IonLabel, IonList } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
//---
import { Nav, Num } from 'src/app/utils/util';
import { InputService } from 'src/app/service/infra/input-service';
//---
import { APP_CONFIG } from 'src/app/config/app.constants';
import { ITextValuePair } from 'src/app/interface/drink';
import { PartyService } from 'src/app/service/features/party-service';
import { MenuService } from 'src/app/service/features/menu-service';
//---
import { FreetextInputComponent } from 'src/app/components/freetext-input/freetext-input.component';
import { NumericInputComponent } from 'src/app/components/numeric-input/numeric-input.component';
import { SharedModalComponent } from 'src/app/components/shared-modal/shared-modal.component';
//---
@Component({
  selector: 'app-addmenu',
  templateUrl: './addmenu.page.html',
  styleUrls: ['./addmenu.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonButton, IonItem, IonGrid, IonRow, IonCol, SharedModalComponent, IonRadio, IonLabel, IonList, IonRadioGroup, FreetextInputComponent, NumericInputComponent ]
})
export class AddmenuPage implements OnInit {

  public idxAlcohol:number            = 0;
  public idxGlass:number              = 0;
  public isLoaded: boolean            = false;
  public  isOpenAddAlcohol:boolean    = false;
  public  isOpenAddGlass:boolean      = false;
  public  name:string                 = '';
  public  alContent:number            = 0;
  public  glass:string                = '';
  public  ml:number                   = 0;

  constructor(
    public  router: Router,
    public  navCtrl: NavController,
    private inputSvc: InputService,
    private menuSvc: MenuService,
    private partySvc: PartyService,
  ) { }

  ngOnInit() {
  }
  ionViewWillEnter() {
    this.partySvc.readBackup();
    this.menuSvc.menuLoaded$.subscribe((loaded: boolean) => {
      this.isLoaded = loaded;
      if (loaded) {
        this.initParam();
      }
    });
  }
  //===========================================================================
  public get nameAlList(): ITextValuePair[] {
    return this.menuSvc.uniqueNameAlPairs;
  }
  public get glassMlList(): ITextValuePair[] {
    return this.menuSvc.uniqueGlassMlPairs;
  }
  public strAlcohol( pair:ITextValuePair){
    return  pair.text + '('+ Num.float(pair.value*100,0) + '度)'
  }
  public strGlass( pair:ITextValuePair){
    return  pair.text + '('+ pair.value + 'ml)'
  }
  //===========================================================================
  private initParam(){
  }
  private setParam(){

  }
  //===========================================================================
  public confirm( _isConfirm:boolean){
    if (_isConfirm){
      this.setParam();
    }
    Nav.back(this.router, this.navCtrl, 'tab-party/shop')
  }
  public onIonInputBlur(ev:any, type:string, key:string){
    const value = ev.target!.value || '';
    if (key === "name"){
      this.name                 = this.inputSvc.readUpdateText( value, type, this.name, APP_CONFIG.NAME_LENGTH_MAX);
      ev.target.value           = this.name;
    } else if (key === 'alContent'){
      const retVal      = this.inputSvc.readUpdatePosiNum( value, type, this.alContent*100, APP_CONFIG.PRICE_M_MAX, APP_CONFIG.DEC_PLACE_M );
      ev.target.value   = retVal.correctStr;
      if ( retVal.isChange){
        this.alContent          = retVal.updateNum*10000;
      }
    }
  }
  public onIonRadio( ev:any, key:string){
    if ( key === 'addAlcohol'){
    } else if ( key === 'addGlass'){
    }
  }
  public modalOpen( key:string ){
    if ( key === 'addAlcohol'){
      this.isOpenAddAlcohol       = true;
    } else if ( key === 'addGlass'){
      this.isOpenAddGlass         = true;
    }
  }
  public modalConfirm( key:string ){
    if ( key === 'addAlcohol'){
      this.isOpenAddAlcohol       = false;
    } else if ( key === 'addGlass'){
      this.isOpenAddGlass         = false;
    }
  }
  public modalCancel(){
    this.isOpenAddAlcohol       = false;
    this.isOpenAddGlass         = false;
    
  }  //===========================================================================
}
