import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonRow, IonCol, IonItem, IonLabel, IonGrid, IonIcon, IonButton } from '@ionic/angular/standalone';
import { DEF } from 'src/app/config/default-constants';
import { AlcToleranceLevel, GenderType } from 'src/app/interface/health';
import { DateService } from 'src/app/service/date-service';
import { InputService } from 'src/app/service/input-service';
import { DrinkService } from 'src/app/service/features/drink-service';
import { WindowService } from 'src/app/service/window-service';
import { NumericInputComponent } from 'src/app/components/numeric-input/numeric-input.component';
import { APP_CONFIG } from 'src/app/config/app.constants';
import { Nav } from 'src/app/utils/util';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { informationCircle } from 'ionicons/icons';
import { PartyService } from 'src/app/service/features/party-service';
import { HealthService } from 'src/app/service/features/health-service';

@Component({
  selector: 'app-first',
  templateUrl: './first.page.html',
  styleUrls: ['./first.page.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonGrid, IonLabel, IonItem, IonCol, IonRow, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, NumericInputComponent]
})
export class FirstPage implements OnInit {

  public  isOpenInputBodyInfo:boolean     = false;
  public  weight:number                   = DEF.WEIGHT;
  public  fatRate100:number               = DEF.FATRATE *100;
  public  gender: GenderType              = DEF.GENDER;
  public  alcTolLevel:AlcToleranceLevel   = 'normal';
  //---

  constructor(
    public  router: Router,
    private dateSvc: DateService,
    private inputSvc: InputService,
    private drinkSvc: DrinkService,
    private healthSvc: HealthService,
    private partySvc: PartyService,
    private windowSvc: WindowService,
  ) {
    addIcons({informationCircle});    
  }
  ngOnInit() {
  }
  ionViewWillEnter() {
    this.partySvc.readBackup();
    this.windowSvc.hideAdBannerByModal();
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
    }
  }
  public arrAlcTolerance(){
    return HealthService.alcToleranceList;
  }
  public selectAlcTol(_level:AlcToleranceLevel){
    this.alcTolLevel= _level;
  } 
  public saveData(){
    const _isoTime  = this.dateSvc.utcDateToIso(new Date);
    this.drinkSvc.setBodyFactorInfo(this.gender,this.alcTolLevel);
    this.drinkSvc.setBodyInfo(_isoTime, this.weight, this.fatRate100/100);
    this.healthSvc.setDataInputDone();
    setTimeout(() => {
      Nav.to(this.router, 'tab-party/shop');
    }, 100);
  }
  //===========================================================================
}
