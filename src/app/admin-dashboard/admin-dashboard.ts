import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';
import { User } from '../user.model';
import { DateService, UserDateRecord } from '../date.service';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  currentAdmin: User | null = null;
  users: User[] = [];
  admins: User[] = [];
  submittedSelections: UserDateRecord[] = [];
  selectedDatesData: any[] = [];
  approvedSelections: any[] = [];
  usersNotSubmitted: any = null;
  totalUsers = 0;
  totalAdmins = 0;
  totalBookings = 0;
  totalSubmissions = 0;
  activeTab = 'overview';

  // User Management Properties
  showAddUserModal = false;
  showEditUserModal = false;
  showUserBookingsModal = false;
  showSubmissionDetailsModal = false;
  editingUser: User | null = null;
  selectedUserBookings: any[] = [];
  selectedUserName = '';
  selectedSubmission: UserDateRecord | null = null;
  newUser = {
    name: '',
    employeeId: '',
    password: '',
    designation: '',
    location: '',
    role: 'user' as 'user' | 'admin'
  };

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
        
        // Load approved selections data if available
        if ((data as any).approvedSelections) {
          this.approvedSelections = (data as any).approvedSelections;
          this.totalBookings = this.approvedSelections.length;
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
  showAddUserForm() {
    this.showAddUserModal = true;
    this.resetNewUserForm();
  }

  closeAddUserModal() {
    this.showAddUserModal = false;
    this.resetNewUserForm();
  }

  resetNewUserForm() {
    this.newUser = {
      name: '',
      employeeId: '',
      password: '',
      designation: '',
      location: '',
      role: 'user'
    };
  }

  addUser() {
    // Validate form
    if (!this.newUser.name || !this.newUser.employeeId || !this.newUser.password || 
        !this.newUser.designation || !this.newUser.location) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.dataService.createUser(this.newUser).subscribe({
      next: (response) => {
        this.toastr.success('User created successfully!', 'Success');
        this.closeAddUserModal();
        this.loadDashboardData(); // Refresh data
      },
      error: (error) => {
        const errorMessage = error.error?.error || 'Failed to create user';
        this.toastr.error(errorMessage, 'Error');
        console.error('Error creating user:', error);
      }
    });
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.showEditUserModal = true;
  }

  closeEditUserModal() {
    this.showEditUserModal = false;
    this.editingUser = null;
  }

  saveUserEdits() {
    if (!this.editingUser) return;

    // Validate form
    if (!this.editingUser.name || !this.editingUser.employeeId || 
        !this.editingUser.designation || !this.editingUser.location) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    const updateData = {
      name: this.editingUser.name,
      employeeId: this.editingUser.employeeId,
      designation: this.editingUser.designation,
      location: this.editingUser.location,
      role: this.editingUser.role
    };

    this.dataService.updateUser(this.editingUser.id, updateData).subscribe({
      next: (response) => {
        this.toastr.success('User updated successfully!', 'Success');
        this.closeEditUserModal();
        this.loadDashboardData(); // Refresh data
      },
      error: (error) => {
        const errorMessage = error.error?.error || 'Failed to update user';
        this.toastr.error(errorMessage, 'Error');
        console.error('Error updating user:', error);
      }
    });
  }

  deleteUser(userId: number) {
    const user = [...this.users, ...this.admins].find(u => u.id === userId);
    const userName = user ? user.name : 'Unknown User';
    
    if (confirm(`Are you sure you want to delete ${userName}? This will also remove all their bookings and submissions.`)) {
      this.dataService.deleteUser(userId).subscribe({
        next: (response) => {
          this.toastr.success(`User ${response.deletedUser} deleted successfully!`, 'Success');
          this.loadDashboardData(); // Refresh data
        },
        error: (error) => {
          const errorMessage = error.error?.error || 'Failed to delete user';
          this.toastr.error(errorMessage, 'Error');
          console.error('Error deleting user:', error);
        }
      });
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

  viewSubmissionDetails(submission: UserDateRecord) {
    this.selectedSubmission = submission;
    this.showSubmissionDetailsModal = true;
  }

  closeSubmissionDetailsModal() {
    this.showSubmissionDetailsModal = false;
    this.selectedSubmission = null;
  }

  getAttachmentUrl(filename: string): string {
    return `http://localhost:3001/uploads/${filename}`;
  }

  downloadAttachment(filename: string) {
    const url = this.getAttachmentUrl(filename);
    window.open(url, '_blank');
  }

  viewUserBookings(userId: number) {
    // Find approved bookings for this user
    const userBookings = this.approvedSelections.filter(booking => +booking.userId === userId);
    const user = this.users.find(u => u.id === userId);
    const userName = user ? user.name : 'Unknown User';
    
    if (userBookings.length === 0) {
      this.toastr.info(`No approved bookings found for ${userName}`, 'No Bookings');
      return;
    }
    
    // Set modal data
    this.selectedUserBookings = userBookings;
    this.selectedUserName = userName;
    this.showUserBookingsModal = true;
    
    console.log('User approved bookings:', userBookings);
    this.toastr.success(`Found ${userBookings.length} approved booking(s) for ${userName}`, 'Bookings Found');
  }

  closeUserBookingsModal() {
    this.showUserBookingsModal = false;
    this.selectedUserBookings = [];
    this.selectedUserName = '';
  }

  viewBookingDetails(booking: any) {
    const details = `
Booking ID: ${booking.id}
Employee: ${booking.employeeId} (${this.getUserName(+booking.userId)})
Status: ${booking.status}
Dates: ${booking.selectedDates.length} selected
Month/Year: ${booking.month}/${booking.year}
Admin Comment: ${booking.adminComment || 'None'}
    `;
    alert(details.trim());
  }

  revokeApproval(booking: any) {
    if (confirm(`Are you sure you want to revoke approval for ${booking.employeeId}'s booking?`)) {
      this.toastr.info('Revoke approval feature needs backend implementation');
      // TODO: Implement revoke approval API call
    }
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

  // Excel Export Functions
  exportAllData() {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Export Users
      const usersData = this.users.map(user => ({
        'User ID': user.id,
        'Name': user.name,
        'Employee ID': user.employeeId,
        'Designation': user.designation,
        'Location': user.location,
        'Role': user.role || 'user'
      }));
      const usersSheet = XLSX.utils.json_to_sheet(usersData);
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');

      // Export Admins
      const adminsData = this.admins.map(admin => ({
        'Admin ID': admin.id,
        'Name': admin.name,
        'Employee ID': admin.employeeId,
        'Designation': admin.designation,
        'Location': admin.location,
        'Role': admin.role || 'admin',
        'Permissions': admin.permissions ? admin.permissions.join(', ') : ''
      }));
      const adminsSheet = XLSX.utils.json_to_sheet(adminsData);
      XLSX.utils.book_append_sheet(workbook, adminsSheet, 'Admins');

      // Export Approved Bookings
      if (this.approvedSelections.length > 0) {
        const bookingsData = this.approvedSelections.map(booking => ({
          'Booking ID': booking.id,
          'Employee ID': booking.employeeId,
          'User Name': this.getUserName(+booking.userId),
          'Designation': booking.userDesignation,
          'Location': booking.userLocation,
          'Month': booking.month,
          'Year': booking.year,
          'Status': booking.status,
          'Total Dates': booking.selectedDates.length,
          'Submitted Date': this.formatDateTime(booking.submittedAt),
          'Approved Date': this.formatDateTime(booking.reviewedAt),
          'Admin Comment': booking.adminComment || 'None',
          'Roster Dates': booking.selectedDates.map((date: string) => this.formatDate(date)).join(', ')
        }));
        const bookingsSheet = XLSX.utils.json_to_sheet(bookingsData);
        XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Approved Bookings');
      }

      // Export Pending Submissions
      if (this.submittedSelections.length > 0) {
        const submissionsData = this.submittedSelections.map(submission => ({
          'Submission ID': submission.id,
          'Employee ID': submission.employeeId,
          'User Name': this.getUserName(Number(submission.userId)),
          'Designation': submission.userDesignation,
          'Location': submission.userLocation,
          'Month': submission.month,
          'Year': submission.year,
          'Status': submission.status,
          'Total Dates': submission.selectedDates.length,
          'Submitted Date': this.formatDateTime(submission.submittedAt!),
          'Roster Dates': submission.selectedDates.map(date => this.formatDate(date)).join(', ')
        }));
        const submissionsSheet = XLSX.utils.json_to_sheet(submissionsData);
        XLSX.utils.book_append_sheet(workbook, submissionsSheet, 'Pending Submissions');
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `WorkdayWizard_Export_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);
      
      this.toastr.success('Data exported successfully!', 'Export Complete');
    } catch (error) {
      console.error('Export error:', error);
      this.toastr.error('Failed to export data', 'Export Error');
    }
  }

  exportUsers() {
    try {
      const usersData = [...this.users, ...this.admins].map(user => ({
        'User ID': user.id,
        'Name': user.name,
        'Employee ID': user.employeeId,
        'Designation': user.designation,
        'Location': user.location,
        'Role': user.role || (this.admins.includes(user) ? 'admin' : 'user'),
        'Permissions': user.permissions ? user.permissions.join(', ') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(usersData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Users_Export_${currentDate}.xlsx`;

      XLSX.writeFile(workbook, filename);
      this.toastr.success('Users data exported successfully!', 'Export Complete');
    } catch (error) {
      console.error('Export error:', error);
      this.toastr.error('Failed to export users data', 'Export Error');
    }
  }

  exportBookings() {
    try {
      if (this.approvedSelections.length === 0) {
        this.toastr.warning('No approved bookings to export', 'No Data');
        return;
      }

      const bookingsData = this.approvedSelections.map(booking => ({
        'Booking ID': booking.id,
        'Employee ID': booking.employeeId,
        'User Name': this.getUserName(+booking.userId),
        'Designation': booking.userDesignation,
        'Location': booking.userLocation,
        'Month': booking.month,
        'Year': booking.year,
        'Status': booking.status,
        'Total Dates': booking.selectedDates.length,
        'Submitted Date': this.formatDateTime(booking.submittedAt),
        'Approved Date': this.formatDateTime(booking.reviewedAt),
        'Admin Comment': booking.adminComment || 'None'
      }));

      // Create a second sheet with detailed roster dates
      const detailedBookingsData: any[] = [];
      this.approvedSelections.forEach(booking => {
        booking.selectedDates.forEach((date: string, index: number) => {
          detailedBookingsData.push({
            'Booking ID': booking.id,
            'Employee ID': booking.employeeId,
            'User Name': this.getUserName(+booking.userId),
            'Date #': index + 1,
            'Roster Date': this.formatDate(date),
            'Day': new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
            'Month/Year': `${booking.month}/${booking.year}`
          });
        });
      });

      const workbook = XLSX.utils.book_new();
      
      const summarySheet = XLSX.utils.json_to_sheet(bookingsData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Bookings Summary');
      
      const detailSheet = XLSX.utils.json_to_sheet(detailedBookingsData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed Roster Dates');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Approved_Bookings_${currentDate}.xlsx`;

      XLSX.writeFile(workbook, filename);
      this.toastr.success('Bookings data exported successfully!', 'Export Complete');
    } catch (error) {
      console.error('Export error:', error);
      this.toastr.error('Failed to export bookings data', 'Export Error');
    }
  }

  exportSubmissions() {
    try {
      if (this.submittedSelections.length === 0) {
        this.toastr.warning('No pending submissions to export', 'No Data');
        return;
      }

      const submissionsData = this.submittedSelections.map(submission => ({
        'Submission ID': submission.id,
        'Employee ID': submission.employeeId,
        'User Name': this.getUserName(Number(submission.userId)),
        'Designation': submission.userDesignation,
        'Location': submission.userLocation,
        'Month': submission.month,
        'Year': submission.year,
        'Status': submission.status,
        'Total Dates': submission.selectedDates.length,
        'Submitted Date': this.formatDateTime(submission.submittedAt!),
        'Roster Dates': submission.selectedDates.map(date => this.formatDate(date)).join(', ')
      }));

      const worksheet = XLSX.utils.json_to_sheet(submissionsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Submissions');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Pending_Submissions_${currentDate}.xlsx`;

      XLSX.writeFile(workbook, filename);
      this.toastr.success('Submissions data exported successfully!', 'Export Complete');
    } catch (error) {
      console.error('Export error:', error);
      this.toastr.error('Failed to export submissions data', 'Export Error');
    }
  }
}
