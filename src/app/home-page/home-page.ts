import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { User } from '../user.model';
import { Observable } from 'rxjs';
import { CalenderUI } from '../calender-ui/calender-ui';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CalenderUI],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePage {
  currentUser: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.currentUser;
  }
}
