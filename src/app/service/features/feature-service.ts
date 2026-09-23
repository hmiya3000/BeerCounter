import { Injectable } from '@angular/core';
import { RoutingService } from '../infra/routing-service';
import { AppmodeService } from './appmode-service';
import { PartyService } from './party-service';

@Injectable({
  providedIn: 'root',
})
export class FeatureService {

  //===========================================================================
  constructor(
    private appmodeSvc: AppmodeService,
    private partySvc: PartyService,
    private routingSvc: RoutingService,
  ){
  }
 //===========================================================================
  public readBackup(){
    this.appmodeSvc.readBackup();
    this.partySvc.readBackup();
  }  
  public clearBackup(){
    this.partySvc.clearBackup();
  }
  public clearBackupDebug(){
    this.partySvc.clearBackupDebug();
  }
  //===========================================================================
  public get withAd() :boolean {
    return this.appmodeSvc.info().withAd;
  }
 public async initialize(){
    this.appmodeSvc.initialize();
    this.routingSvc.loadRoutingMonitor();
    await this.partySvc.initialize();
  }
  public finalize(){
    //
  }
 //===========================================================================
 // for Salvage
  public convertTextToData(decodedJsonText:any){
  }
  public async recoveryData(oldData: any): Promise<void>{
  }
  public errorRecoveryData(){  
  }
  public async salvageFin(isSuccess:boolean){  
  }
 //===========================================================================
}
