import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { User } from '../user.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  currentUser: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.currentUser;
  }

  logout() {
    this.authService.logout();
  }
}
