import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tab-party/tab-party.routes').then((m) => m.routes),
  },
  {
    path: 'addmenu',
    loadComponent: () => import('./page/addmenu/addmenu.page').then( m => m.AddmenuPage)
  },
  {
    path: 'first',
    loadComponent: () => import('./page/first/first.page').then( m => m.FirstPage)
  },
];
