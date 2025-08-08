import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { User } from '../user.model';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  showUserLogin = false;
  showAdminLogin = false;
  designations = ['Manager', 'Senior Manager', 'Technical Lead', 'System Administrator'];
  passwordFieldType = 'password';

  user = {
    employeeId: '',
    password: ''
  };

  admin = {
    employeeId: '',
    password: '',
    designation: ''
  };

  constructor(
    private router: Router,
    private dataService: DataService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

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

  togglePasswordVisibility() {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  loginUser() {
    this.dataService.getUsers().subscribe(data => {
      const foundUser = data.users.find((u: User) => u.employeeId === this.user.employeeId);
      if (foundUser) {
        if (foundUser.password === this.user.password) {
          this.toastr.success('Login successful!');
          this.authService.login(foundUser);
          this.router.navigate(['/user-dashboard']);
        } else {
          this.toastr.error('Invalid password');
        }
      } else {
        this.toastr.error('User ID and password are invalid');
      }
    });
  }

  loginAdmin() {
    this.dataService.getAllData().subscribe(data => {
      // First check in admins collection (for new admin users like jey123)
      const foundAdmin = data.admins.find((admin: User) =>
        admin.employeeId === this.admin.employeeId
      );
      
      if (foundAdmin) {
        if (foundAdmin.password === this.admin.password) {
          this.toastr.success('Admin login successful!');
          this.authService.login(foundAdmin);
          this.router.navigate(['/admin-dashboard']);
          return;
        } else {
          this.toastr.error('Invalid password');
          return;
        }
      }
      
      // Fallback to check in users collection for existing admin users
      const foundUser = data.users.find((u: User) =>
        u.employeeId === this.admin.employeeId &&
        u.designation === this.admin.designation
      );
      
      if (foundUser) {
        if (foundUser.password === this.admin.password) {
          this.toastr.success('Login successful!');
          this.authService.login(foundUser);
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.toastr.error('Invalid password');
        }
      } else {
        this.toastr.error('Admin credentials are invalid');
      }
    });
  }
}
