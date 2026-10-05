import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { Entry } from './pages/entry/entry';
import { Login } from './pages/login/login';
import { Overview } from './pages/overview/overview';
import { Profit } from './pages/profit/profit';
import { Salary } from './pages/salary/salary';
import { Shell } from './pages/shell/shell';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Login · Khova Sweet' },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: Overview, title: 'Dashboard · Khova Sweet' },
      { path: 'entry', component: Entry, title: 'Add Entry · Khova Sweet' },
      { path: 'profit', component: Profit, title: 'Profit & Loss · Khova Sweet' },
      { path: 'salary', component: Salary, title: 'Salary · Khova Sweet' },
    ],
  },
  { path: '**', redirectTo: '' },
];
