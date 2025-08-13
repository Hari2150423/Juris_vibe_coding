import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { DataService } from '../../data.service';
import { DateService, SaveDateRequest } from '../../date.service';
import { User } from '../../user.model';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-calender-ui',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calender-ui.html',
  styleUrls: ['./calender-ui.css']
})
export class CalenderUI implements OnInit, OnChanges {
  @Input() editMode: boolean = false;
  @Input() preSelectedDates: Date[] = [];
  @Output() editCompleted = new EventEmitter<void>();
  @Output() draftSaved = new EventEmitter<void>();

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];
  
  currentWeekStart!: Date;
  currentWeekDates: Date[] = [];
  selectedDates: Date[] = [];
  today = new Date();
  currentUser: Observable<User | null>;
  userLocation: string = '';
  userDesignation: string = '';
  userId: number = 0;
  employeeId: string = '';
  workingDaysInMonth: number = 0;
  elapsedWorkingDays: number = 0;
  selectedFile: File | null = null;
  private isSaving = false; // Add saving state to prevent double-clicks
  private loadedToastShown = false; // Flag to show toast only once

  constructor(
    private authService: AuthService, 
    private dataService: DataService,
    private dateService: DateService,
    private toastr: ToastrService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.initializeCalendar();
    this.currentUser.subscribe(user => {
      if (user) {
        this.employeeId = user.employeeId;
        this.dataService.getUsers().subscribe(data => {
          const foundUser = data.users.find(u => u.employeeId === user.employeeId);
          if (foundUser) {
            this.userId = foundUser.id;
            this.userLocation = foundUser.location;
            this.userDesignation = foundUser.designation;
            this.calculateWorkingDaysInMonth();
            
            if (this.editMode && this.preSelectedDates.length > 0) {
              // In edit mode, use the preselected dates
              this.selectedDates = [...this.preSelectedDates];
            } else {
              // Normal mode, load saved dates from API
              this.loadSavedDates();
            }
          }
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preSelectedDates'] && this.editMode) {
      this.selectedDates = [...this.preSelectedDates];
    }
  }

  initializeCalendar() {
    // Start from current week
    this.currentWeekStart = this.getStartOfWeek(new Date());
    this.generateCurrentWeek();
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  generateCurrentWeek() {
    this.currentWeekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);
      this.currentWeekDates.push(date);
    }
  }

  calculateWorkingDaysInMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    let elapsedDays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i).getDay();
      const currentDate = new Date(year, month, i);
      currentDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (day !== 0 && day !== 6) { // Not a weekend
        workingDays++;
        if (currentDate < today) {
          elapsedDays++;
        }
      }
    }
    this.workingDaysInMonth = workingDays;
    this.elapsedWorkingDays = elapsedDays;
  }

  isDateInCurrentWeek(date: Date): boolean {
    const weekStart = new Date(this.currentWeekStart);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  }

  isDateInCurrentMonthStrict(date: Date): boolean {
    return date.getMonth() === this.today.getMonth() && date.getFullYear() === this.today.getFullYear();
  }

  previousWeek() {
    const newWeekStart = new Date(this.currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    this.currentWeekStart = newWeekStart;
    this.generateCurrentWeek();
    this.calculateWorkingDaysInMonth(); // Recalculate for new month
  }

  nextWeek() {
    const newWeekStart = new Date(this.currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    this.currentWeekStart = newWeekStart;
    this.generateCurrentWeek();
    this.calculateWorkingDaysInMonth(); // Recalculate for new month
  }

  canGoPrevious(): boolean {
    const previousWeek = new Date(this.currentWeekStart);
    previousWeek.setDate(previousWeek.getDate() - 7);
    return previousWeek.getMonth() === this.today.getMonth() || previousWeek.getFullYear() === this.today.getFullYear();
  }

  getCurrentWeekString(): string {
    const endOfWeek = new Date(this.currentWeekStart);
    endOfWeek.setDate(this.currentWeekStart.getDate() + 6);
    
    return `${this.formatDateShort(this.currentWeekStart)} - ${this.formatDateShort(endOfWeek)}`;
  }

  formatDateShort(date: Date): string {
    const month = this.monthNames[date.getMonth()];
    return `${month} ${date.getDate()}, ${date.getFullYear()}`;
  }

  selectDate(date: Date, dayIndex: number) {
    // Block weekends (Sunday = 0, Saturday = 6)
    if (this.isWeekend(dayIndex) || this.isPastDate(date) || !this.isDateInCurrentMonthStrict(date)) {
      return;
    }

    const isProgrammer = this.userDesignation === 'Programmer Analyst' || this.userDesignation === 'Programmer Analyst Trainee';
    const existingIndex = this.selectedDates.findIndex(selected => 
      this.isSameDate(selected, date)
    );

    if (existingIndex > -1) {
      // Remove if already selected
      this.selectedDates.splice(existingIndex, 1);
    } else {
      const maxDays = this.workingDaysInMonth - this.elapsedWorkingDays;
      if (isProgrammer) {
        // Programmers select at least 12 days, up to total working days in month
        if (this.selectedDates.length < maxDays) {
          this.selectedDates.push(new Date(date));
          this.selectedDates.sort((a, b) => a.getTime() - b.getTime());
        } else if (this.selectedDates.length === maxDays && existingIndex === -1) {
          return;
        }
      } else {
        // Other designations: minimum 12 days, up to total working days in month
        if (this.selectedDates.length < maxDays) {
          this.selectedDates.push(new Date(date));
          this.selectedDates.sort((a, b) => a.getTime() - b.getTime());
        } else if (this.selectedDates.length === maxDays && existingIndex === -1) {
          return;
        }
      }
    }
  }

  removeDate(date: Date) {
    const index = this.selectedDates.findIndex(selected => 
      this.isSameDate(selected, date)
    );
    if (index > -1) {
      this.selectedDates.splice(index, 1);
    }
  }

  isWeekend(dayIndex: number): boolean {
    return dayIndex === 0 || dayIndex === 6; // Sunday or Saturday
  }

  isSelected(date: Date): boolean {
    return this.selectedDates.some(selected => 
      this.isSameDate(selected, date)
    );
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  }

  isPastWeek(date: Date): boolean {
    const currentWeekStart = this.getStartOfWeek(new Date());
    const dateWeekStart = this.getStartOfWeek(date);
    return dateWeekStart < currentWeekStart;
  }

  isToday(date: Date): boolean {
    return this.isSameDate(date, this.today);
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  getMonthName(date: Date): string {
    return this.monthNames[date.getMonth()];
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  saveSelection() {
    console.log('CalendarUI: Save Selection button clicked (as draft)');
    console.log('CalendarUI: Current user data - userId:', this.userId, 'employeeId:', this.employeeId);
    console.log('CalendarUI: Selected dates:', this.selectedDates);
    
    // Prevent multiple simultaneous save operations
    if (this.isSaving) {
      this.toastr.warning('Save operation already in progress...', 'Please Wait');
      return;
    }

    // Check if user is still authenticated
    if (!this.employeeId || !this.userId) {
      this.toastr.error('User authentication lost. Please login again.', 'Authentication Error');
      return;
    }

    const isProgrammer = this.userDesignation === 'Programmer Analyst' || this.userDesignation === 'Programmer Analyst Trainee';
    const remainingWorkingDays = this.workingDaysInMonth - this.elapsedWorkingDays;
    
    const isDateCriteriaMet = isProgrammer 
      ? this.selectedDates.length === remainingWorkingDays 
      : (this.selectedDates.length >= 12 && this.selectedDates.length <= remainingWorkingDays);

    // Allow submission if only an image is attached
    const canSubmit = isDateCriteriaMet || !!this.selectedFile;

    if (canSubmit) {
      this.isSaving = true; // Set saving state
      const saveRequest: SaveDateRequest = {
        userId: this.userId,
        employeeId: this.employeeId,
        selectedDates: this.selectedDates.map(date => date.toISOString()),
        userDesignation: this.userDesignation,
        userLocation: this.userLocation,
        attachment: this.selectedFile || undefined
      };
      this.toastr.info('Saving draft selection...', 'Saving');
      this.dateService.saveSelectedDates(saveRequest).subscribe({
        next: (response) => {
          this.toastr.success(`Successfully saved ${response.savedDates} working days as draft!`, 'Draft Saved');
          if (this.selectedFile) {
            this.toastr.info(`File attached: ${this.selectedFile.name}`, 'File Info');
          }
          // If only an image is attached and no dates, immediately submit for admin approval
          if (this.selectedFile && (!this.selectedDates || this.selectedDates.length === 0)) {
            // Emit a custom event or call a method to trigger submit for admin approval
            if (this.editMode) {
              this.editCompleted.emit();
            } else {
              this.draftSaved.emit();
            }
            // Optionally, you can call a parent method to auto-submit
          } else if (this.editMode) {
            this.editCompleted.emit();
          } else {
            // Add a small delay to ensure the parent component refreshes properly
            setTimeout(() => {
              this.draftSaved.emit();
            }, 500);
          }
          this.isSaving = false; // Reset saving state
        },
        error: (error) => {
          this.toastr.error('Failed to save draft. Please try again.', 'Error');
          this.isSaving = false; // Reset saving state
        }
      });
    } else {
      if (isProgrammer) {
        this.toastr.warning(`Please select exactly ${remainingWorkingDays} working days or attach an image.`, 'Selection Required');
      } else {
        this.toastr.warning(`Please select at least 12 working days, up to ${remainingWorkingDays} days, or attach an image.`, 'Selection Required');
      }
    }
  }

  // Load previously saved dates for the current user
  loadSavedDates() {
    if (this.employeeId) {
      this.dateService.getUserDraftDates(this.employeeId).subscribe({
        next: (response) => {
          if (response.selectedDates && response.selectedDates.length > 0) {
            // Convert saved ISO strings back to Date objects
            this.selectedDates = response.selectedDates.map(dateStr => new Date(dateStr));
            console.log('Loaded draft dates:', this.selectedDates);
            this.toastr.info(`Loaded ${this.selectedDates.length} previously saved draft days`, 'Draft Loaded');
          }
        },
        error: (error) => {
          console.log('No previously saved draft found or error loading:', error);
          // This is not necessarily an error - user might not have saved dates yet
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
        this.selectedFile = file;
        alert(`File selected: ${file.name}`);
      } else {
        this.selectedFile = null;
        alert('Please select a PNG, JPG, or JPEG image.');
      }
    }
  }

  clearSelection() {
    this.selectedDates = [];
    this.selectedFile = null;
  }

  removeSelectedFile() {
    this.selectedFile = null;
  }
}
