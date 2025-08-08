import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { User } from '../../user.model';
import { Observable } from 'rxjs';
import { CalenderUI } from '../calender-ui/calender-ui';
import { DataService } from '../../data.service';
import { DateService } from '../../date.service';

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
  employeeId: string = '';
  hasPreviousSelection: boolean = false;
  previousSelectionDates: Date[] = [];
  previousSelectionSavedAt: string = '';
  showEditMode: boolean = false;

  constructor(
    private authService: AuthService, 
    private dataService: DataService,
    private dateService: DateService
  ) {
    this.currentUser = this.authService.currentUser;
    this.currentUser.subscribe(user => {
      if (user) {
        this.employeeId = user.employeeId;
        this.dataService.getUsers().subscribe(data => {
          const foundUser = data.users.find(u => u.employeeId === user.employeeId);
          if (foundUser) {
            this.userLocation = foundUser.location;
          }
        });
        this.checkForPreviousSelection();
      }
    });
  }

  checkForPreviousSelection() {
    if (this.employeeId) {
      this.dateService.getUserSavedDates(this.employeeId).subscribe({
        next: (response) => {
          if (response.selectedDates && response.selectedDates.length > 0) {
            this.hasPreviousSelection = true;
            this.previousSelectionDates = response.selectedDates.map(dateStr => new Date(dateStr));
            this.previousSelectionSavedAt = response.savedAt;
          } else {
            this.hasPreviousSelection = false;
          }
        },
        error: (error) => {
          this.hasPreviousSelection = false;
        }
      });
    }
  }

  enableEditMode() {
    this.showEditMode = true;
  }

  cancelEditMode() {
    this.showEditMode = false;
    // Refresh to get latest data
    this.checkForPreviousSelection();
  }

  onEditCompleted() {
    // When editing is completed successfully, exit edit mode and refresh the selection info
    this.showEditMode = false;
    this.checkForPreviousSelection();
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatSavedTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
