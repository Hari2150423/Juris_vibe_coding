import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { UserDashboardComponent } from './user-dashboard/user-dashboard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'user-dashboard', component: UserDashboardComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
