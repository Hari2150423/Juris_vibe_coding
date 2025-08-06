import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calender-ui',
  imports: [CommonModule],
  templateUrl: './calender-ui.html',
  styleUrl: './calender-ui.css'
})
export class CalenderUI implements OnInit {
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];
  
  currentWeekStart!: Date;
  currentWeekDates: Date[] = [];
  selectedDates: Date[] = [];
  today = new Date();

  ngOnInit() {
    this.initializeCalendar();
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
    
    // Filter selected dates to only include current week
    this.selectedDates = this.selectedDates.filter(date => 
      this.isDateInCurrentWeek(date)
    );
  }

  isDateInCurrentWeek(date: Date): boolean {
    const weekStart = new Date(this.currentWeekStart);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateCurrentWeek();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateCurrentWeek();
  }

  canGoPrevious(): boolean {
    const previousWeek = new Date(this.currentWeekStart);
    previousWeek.setDate(previousWeek.getDate() - 7);
    return previousWeek >= this.getStartOfWeek(this.today);
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
    if (this.isWeekend(dayIndex)) {
      return;
    }

    // Check if date is already selected
    const existingIndex = this.selectedDates.findIndex(selected => 
      this.isSameDate(selected, date)
    );

    if (existingIndex > -1) {
      // Remove if already selected
      this.selectedDates.splice(existingIndex, 1);
    } else {
      // Add if not selected and under limit
      if (this.selectedDates.length < 5) {
        this.selectedDates.push(new Date(date));
        this.selectedDates.sort((a, b) => a.getTime() - b.getTime());
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
    if (this.selectedDates.length >= 3 && this.selectedDates.length <= 5) {
      console.log('Saved working days:', this.selectedDates);
      // Here you can implement the logic to save the selection
      // For example, send to a service or emit an event
      alert(`Successfully saved ${this.selectedDates.length} working days!`);
    }
  }

  clearSelection() {
    this.selectedDates = [];
  }
}
