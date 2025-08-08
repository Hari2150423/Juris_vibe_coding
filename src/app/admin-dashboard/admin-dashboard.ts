import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';
import { User } from '../user.model';
import { DateService, UserDateRecord } from '../date.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  currentAdmin: User | null = null;
  users: User[] = [];
  admins: User[] = [];
  submittedSelections: UserDateRecord[] = [];
  selectedDatesData: any[] = [];
  usersNotSubmitted: any = null;
  totalUsers = 0;
  totalAdmins = 0;
  totalBookings = 0;
  totalSubmissions = 0;
  activeTab = 'overview';

  constructor(
    private router: Router,
    private dataService: DataService,
    private authService: AuthService,
    private dateService: DateService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Delay authentication check to allow client-side hydration
    setTimeout(() => {
      this.initializeAdminDashboard();
    }, 100);
  }

  private initializeAdminDashboard() {
    // Refresh authentication state from localStorage (client-side only)
    this.authService.refreshAuthState();
    
    this.currentAdmin = this.authService.getCurrentUser();
    
    if (!this.currentAdmin) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Check if user has admin role or is in the admin collection
    if (this.currentAdmin.role === 'admin' || this.currentAdmin.designation === 'System Administrator') {
      this.loadDashboardData();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadDashboardData() {
    this.dataService.getAllData().subscribe({
      next: (data) => {
        this.users = data.users || [];
        this.admins = data.admins || [];
        this.totalUsers = this.users.length;
        this.totalAdmins = this.admins.length;
        
        // Load selected dates data if available
        if ((data as any).selectedDates) {
          this.selectedDatesData = (data as any).selectedDates;
          this.totalBookings = this.selectedDatesData.length;
        }
        
        // Load submitted selections
        this.loadSubmittedSelections();
        
        // Load users who haven't submitted
        this.loadUsersNotSubmitted();
      },
      error: (error) => {
        this.toastr.error('Failed to load dashboard data');
        console.error('Error loading data:', error);
      }
    });
  }

  loadSubmittedSelections() {
    this.dateService.getSubmittedSelections().subscribe({
      next: (submissions) => {
        this.submittedSelections = submissions;
        this.totalSubmissions = submissions.length;
      },
      error: (error) => {
        console.error('Error loading submitted selections:', error);
      }
    });
  }

  loadUsersNotSubmitted() {
    this.dateService.getUsersNotSubmitted().subscribe({
      next: (data) => {
        this.usersNotSubmitted = data;
      },
      error: (error) => {
        console.error('Error loading users who haven\'t submitted:', error);
        this.toastr.error('Failed to load pending submissions data');
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  logout() {
    this.authService.logout();
    this.toastr.success('Logged out successfully');
  }

  // User management functions
  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      // This would need to be implemented in the backend
      this.toastr.info('User deletion feature needs backend implementation');
    }
  }

  // Booking management functions
  approveSubmission(submission: UserDateRecord) {
    const adminComment = prompt('Enter approval comment (optional):');
    this.dateService.approveSelection(submission.id, adminComment || undefined).subscribe({
      next: () => {
        this.toastr.success('Selection approved successfully!', 'Approved');
        this.loadSubmittedSelections(); // Refresh the list
      },
      error: (error) => {
        this.toastr.error('Failed to approve selection', 'Error');
        console.error('Approval error:', error);
      }
    });
  }

  rejectSubmission(submission: UserDateRecord) {
    const adminComment = prompt('Enter rejection reason:');
    if (adminComment && adminComment.trim()) {
      this.dateService.rejectSelection(submission.id, adminComment).subscribe({
        next: () => {
          this.toastr.success('Selection rejected', 'Rejected');
          this.loadSubmittedSelections(); // Refresh the list
        },
        error: (error) => {
          this.toastr.error('Failed to reject selection', 'Error');
          console.error('Rejection error:', error);
        }
      });
    } else {
      this.toastr.warning('Rejection reason is required', 'Missing Information');
    }
  }

  viewUserBookings(userId: number) {
    const userBookings = this.selectedDatesData.filter(booking => booking.userId === userId);
    console.log('User bookings:', userBookings);
    this.toastr.info(`Found ${userBookings.length} bookings for this user`);
  }

  deleteBooking(bookingId: number) {
    if (confirm('Are you sure you want to delete this booking?')) {
      // This would need to be implemented in the backend
      this.toastr.info('Booking deletion feature needs backend implementation');
    }
  }

  // Utility functions
  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  // Remind user to submit roster dates
  remindUser(user: any) {
    // In a real application, this would send an email or notification
    this.toastr.info(`Reminder sent to ${user.name} (${user.employeeId})`, 'Reminder Sent');
    console.log('Reminder sent to user:', user);
  }

  // View user details
  viewUserDetails(user: any) {
    this.toastr.info(`Viewing details for ${user.name}`, 'User Details');
    console.log('User details:', user);
  }

  // Refresh all dashboard data
  refreshDashboardData() {
    this.toastr.info('Refreshing dashboard data...', 'Refreshing');
    this.loadDashboardData();
  }
}
