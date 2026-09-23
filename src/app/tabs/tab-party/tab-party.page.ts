import { Component, OnInit, EnvironmentInjector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonItem, IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { storefront, home, documentText, informationCircle, calendar, beer} from 'ionicons/icons';
import { environment } from 'src/environments/environment';
//---
import { DeviceService } from 'src/app/service/infra/device-service';
import { WindowService } from 'src/app/service/infra/window-service';
//---
import { AppmodeService } from 'src/app/service/features/appmode-service';
import { MenuService } from 'src/app/service/features/menu-service';
//---
import { SharedModalComponent } from 'src/app/components/shared-modal/shared-modal.component';
//---
@Component({
  selector: 'app-tab-party',
  templateUrl: 'tab-party.page.html',
  styleUrls: ['tab-party.page.scss'],
  imports: [CommonModule, IonContent, IonItem, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, SharedModalComponent],
})
export class TabPartyPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  public  isOpenReleaseNote:boolean       = false;
  public  version:string                  = '';
  public  build:string                    = '';
  public  buildTime: string               = '読み込み中...';

  //===========================================================================
  constructor(
    private http: HttpClient,
    private appModeSvc: AppmodeService,
    private deviceSvc: DeviceService,
    private menuSvc: MenuService,
    private windowSvc: WindowService,
  ) {
    addIcons({ storefront, home, documentText,informationCircle, calendar, beer});
  }
  ngOnInit(){
    this.appModeSvc.readBackup();
    this.http.get<{ timestamp: number, displayTime: string }>('assets/build-time.json')
    .subscribe({
      next: (data) => {
        this.buildTime = data.displayTime;
      },
      error: (err) => {
        console.error('ビルド時刻の取得に失敗しました。', err);
        this.buildTime = '取得不可 (ローカル開発時など)';
      }
    });
  }
  ionViewWillEnter(){
    ({version:this.version, build:this.build} =  this.deviceSvc.infoVer());
  }
  public ionViewWillLeave(): void {
    this.clearTabFocus();
  }
  //===========================================================================
  public get isShop(): boolean{
    return this.menuSvc.isShop;
  }
  //===========================================================================
  public clearTabFocus(): void {
    try {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && typeof activeEl.blur === 'function') {
        activeEl.blur();
      }
    } catch (e) {
      console.error(e);
    }
  }
  //===========================================================================
  public get isProduction(): boolean{
    return environment.production
  }
  public get strVer():string{
    return this.deviceSvc.infoVer().strVer;
  }
  public modalOpen( key:string ){
    this.windowSvc.hideAdBannerByModal();
    if ( key === 'releaseNote'){
      this.isOpenReleaseNote    = true;
    }
  }
  public modalConfirm( isConfirm:boolean, key:string ){
    if ( key === 'releaseNote'){
      this.isOpenReleaseNote    = false;
    }
    this.windowSvc.resumeAdBannerByModal();
  }
  public modalCancel(){
    this.isOpenReleaseNote    = false;
    this.windowSvc.resumeAdBannerByModal();
    
  }  
  //===========================================================================
}
