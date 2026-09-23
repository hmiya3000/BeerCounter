import { Routes } from '@angular/router';
import { TabPartyPage } from './tab-party.page';

export const routes: Routes = [
  {
    path: 'tab-party',
    component: TabPartyPage,
    children: [
      {
        path: 'shop',
        loadComponent: () =>
          import('../../page/shop/shop.page').then((m) => m.ShopPage),
      },
      {
        path: 'order',
        loadComponent: () =>
          import('../../page/order/order.page').then((m) => m.OrderPage),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('../../page/calendar/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'measure',
        loadComponent: () => import('../../page/measure/measure.page').then( m => m.MeasurePage)
      },
      {
        path: 'info',
        loadComponent: () =>
          import('../../page/info/info.page').then((m) => m.InfoPage),
      },
      {
        path: '',
        redirectTo: '/tab-party/shop',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tab-party/shop',
    pathMatch: 'full',
  },
];
