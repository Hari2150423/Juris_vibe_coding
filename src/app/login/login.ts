import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  showUserLogin = false;
  showAdminLogin = false;
  designations = ['Manager', 'Senior Manager', 'Technical Lead'];

  constructor(private router: Router) {}

  displayUserLogin() {
    this.showUserLogin = true;
    this.showAdminLogin = false;
  }

  displayAdminLogin() {
    this.showAdminLogin = true;
    this.showUserLogin = false;
  }

  goBack() {
    this.showUserLogin = false;
    this.showAdminLogin = false;
  }

  HomePage() {
    this.router.navigate(['/home']);
  }
}
