import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { User } from '../../user.model';
import { Observable } from 'rxjs';
import { CalenderUI } from '../calender-ui/calender-ui';
import { DataService } from '../../data.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CalenderUI],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePage {
  currentUser: Observable<User | null>;
  userLocation: string = '';

  constructor(private authService: AuthService, private dataService: DataService) {
    this.currentUser = this.authService.currentUser;
    this.currentUser.subscribe(user => {
      if (user) {
        this.dataService.getUsers().subscribe(data => {
          const foundUser = data.users.find(u => u.employeeId === user.employeeId);
          if (foundUser) {
            this.userLocation = foundUser.location;
          }
        });
      }
    });
  }
}
