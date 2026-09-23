import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Nav } from '../utils/util';
import { NavController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {

  private history: string[]       = [];
  private watchHistory: string[]  = [];

  //===========================================================================
  constructor(
    private router: Router
  ){}
  public loadRoutingMonitor(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.history.push(event.urlAfterRedirects);
    });  
  }
  public getPrevUrl(): string {
    return this.history[this.history.length - 2] || '';
  }
  public getCurrUrl(): string {
    return this.history[this.history.length - 1] || '';
  }
  //===========================================================================
  public to(router: Router, page: string, replace: boolean = true): void {
    this.watchHistory.push(this.getCurrUrl());
    Nav.to(router, page, replace);
  }
  public back(router: Router, navCtrl: NavController) : void {
    const prevUrl:string  = this.getPrevUrl();
    if (this.watchHistory.length > 0){
      this.watchHistory.pop();
      Nav.back(router,navCtrl, prevUrl);
    }
  }
  public startTo(router: Router, page: string, replace: boolean = true): void {
    this.watchHistory   = [];
    this.to( router, page, replace );
  }
  public backTop(router: Router, navCtrl: NavController, page: string ): void {
    this.watchHistory   = [];
    Nav.back(router,navCtrl, page);
  }
  public watchedHistory(){
    return this.watchHistory;
  }
  public watchedLength(){
    return this.watchHistory.length;
  }
  //===========================================================================
}