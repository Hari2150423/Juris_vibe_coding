import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { HomePage } from './home-page/home-page';

export const routes: Routes = [
    { path: 'login', component: LoginComponent, },
    { path: 'home', component: HomePage, },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
];
