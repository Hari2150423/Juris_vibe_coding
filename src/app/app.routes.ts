import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { HomePage } from './user-dashboard/home-page/home-page';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'user-dashboard', component: HomePage },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
