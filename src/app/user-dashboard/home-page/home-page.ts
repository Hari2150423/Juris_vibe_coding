import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { User } from '../../user.model';
import { Observable } from 'rxjs';
import { CalenderUI } from '../calender-ui/calender-ui';
import { DataService } from '../../data.service';
import { DateService, UserDateRecord } from '../../date.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CalenderUI],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePage implements OnInit {
  currentUser: Observable<User | null>;
  userLocation: string = '';
  employeeId: string = '';
  
  // Draft selection data
  hasDraftSelection: boolean = false;
  draftSelectionDates: Date[] = [];
  draftSelectionSavedAt: string = '';
  draftSelection: UserDateRecord | null = null;
  
  // Submitted selection data
  hasSubmittedSelection: boolean = false;
  submittedSelection: UserDateRecord | null = null;
  
  showEditMode: boolean = false;
  isSubmitting: boolean = false;
  showSubmitModal: boolean = false;
  showAllDatesModal: boolean = false;
  showDraftDatesModal: boolean = false;
  status: 'none' | 'pending' | 'approved' = 'none';
  hideEditAndSubmit: boolean = false;
  previousSelectionDates: Date[] = [];
  isSubmitted = false;

  constructor(
    private authService: AuthService, 
    private dataService: DataService,
    private dateService: DateService,
    private toastr: ToastrService
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
        this.checkForSelections();
      }
    });
  }

  ngOnInit() {
    this.checkMonthReset();
    this.checkForSelections();
  }

  checkMonthReset() {
    // If there is a submitted selection, check if it's from a previous month
    if (this.submittedSelection && this.submittedSelection.submittedAt) {
      const submittedDate = new Date(this.submittedSelection.submittedAt);
      const now = new Date();
      if (now.getFullYear() !== submittedDate.getFullYear() || now.getMonth() !== submittedDate.getMonth()) {
        // Reset selections for new month
        this.hasDraftSelection = false;
        this.draftSelectionDates = [];
        this.draftSelectionSavedAt = '';
        this.hasSubmittedSelection = false;
        this.submittedSelection = null;
      }
    }
  }

  checkForSelections() {
    this.checkForSubmittedSelection();
    setTimeout(() => this.checkForDraftSelection(), 0);
  }

  checkForDraftSelection() {
    if (this.employeeId) {
      this.dateService.getUserDraftDates(this.employeeId).subscribe({
        next: (response) => {
          const hasDates = response.selectedDates && response.selectedDates.length > 0;
          const hasAttachment = !!response.attachment;
          if (this.hasSubmittedSelection && this.submittedSelection?.status === 'approved' && !this.isNextMonth()) {
            this.hasDraftSelection = false;
            this.draftSelectionDates = [];
            this.draftSelectionSavedAt = '';
            this.draftSelection = null;
          } else if (hasDates || hasAttachment) {
            this.hasDraftSelection = true;
            this.draftSelectionDates = hasDates ? response.selectedDates.map(dateStr => new Date(dateStr)) : [];
            this.draftSelectionSavedAt = response.savedAt;
            this.draftSelection = response;
          } else {
            this.hasDraftSelection = false;
            this.draftSelection = null;
          }
          this.determineDisplayPriority();
        },
        error: (error) => {
          this.hasDraftSelection = false;
          this.draftSelection = null;
          this.determineDisplayPriority();
        }
      });
    }
  }

  checkForSubmittedSelection() {
    if (this.employeeId) {
      // Get all approved selections for the user
      this.dateService.getUserApprovedDates(this.employeeId).subscribe({
        next: (approvedList) => {
          const now = new Date();
          // Filter for current month/year
          const currentApproved = approvedList
            .filter(sel => sel.month === (now.getMonth() + 1) && sel.year === now.getFullYear())
            .sort((a, b) => new Date(b.reviewedAt || b.submittedAt || b.savedAt).getTime() - new Date(a.reviewedAt || a.submittedAt || a.savedAt).getTime());
          if (currentApproved.length > 0) {
            this.hasSubmittedSelection = true;
            this.submittedSelection = currentApproved[0];
            this.submittedSelection.status = 'approved';
            this.determineDisplayPriority();
            return;
          }
          // If not approved, check for submitted (pending/rejected)
          this.dateService.getUserSubmittedDates(this.employeeId).subscribe({
            next: (response) => {
              if (response && ((response.selectedDates && response.selectedDates.length > 0) || response.attachment)) {
                this.hasSubmittedSelection = true;
                this.submittedSelection = response;
              } else {
                this.hasSubmittedSelection = false;
                this.submittedSelection = null;
              }
              this.determineDisplayPriority();
            },
            error: () => {
              this.hasSubmittedSelection = false;
              this.submittedSelection = null;
              this.determineDisplayPriority();
            }
          });
        },
        error: () => {
          // fallback to submitted if approved not found
          this.dateService.getUserSubmittedDates(this.employeeId).subscribe({
            next: (response) => {
              if (response && ((response.selectedDates && response.selectedDates.length > 0) || response.attachment)) {
                this.hasSubmittedSelection = true;
                this.submittedSelection = response;
              } else {
                this.hasSubmittedSelection = false;
                this.submittedSelection = null;
              }
              this.determineDisplayPriority();
            },
            error: () => {
              this.hasSubmittedSelection = false;
              this.submittedSelection = null;
              this.determineDisplayPriority();
            }
          });
        }
      });
    }
  }

  // Helper method to determine which section to show based on timestamps
  determineDisplayPriority() {
    if (this.hasDraftSelection && this.hasSubmittedSelection) {
      const draftTime = new Date(this.draftSelectionSavedAt);
      const submittedTime = new Date(this.submittedSelection!.savedAt || this.submittedSelection!.submittedAt!);
      
      // If draft is more recent, hide submitted selection to prioritize showing draft
      if (draftTime > submittedTime) {
        this.hasSubmittedSelection = false;
      } else {
        // If submitted is more recent, hide draft to prioritize showing submitted
        this.hasDraftSelection = false;
      }
    }
    // If approved and not next month, hide draft section and ensure edit mode is off
    if (this.hasSubmittedSelection && this.submittedSelection?.status === 'approved' && !this.isNextMonth()) {
      this.hasDraftSelection = false;
      this.showEditMode = false;
    }
  }

  submitForReview() {
    if (!this.hasDraftSelection) {
      this.toastr.warning('No draft selection found to submit', 'Nothing to Submit');
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.toastr.info('Submitting for review...', 'Processing');

    this.dateService.submitForReview(this.employeeId).subscribe({
      next: (response) => {
        this.toastr.success('Selection submitted for admin review!', 'Submitted Successfully');
        this.hasDraftSelection = false;
        this.isSubmitting = false;
        this.checkForSelections(); // Refresh all selections
      },
      error: (error) => {
        this.toastr.error('Failed to submit selection. Please try again.', 'Submission Failed');
        this.isSubmitting = false;
      }
    });
  }

  enableEditMode() {
    this.showEditMode = true;
  }

  cancelEditMode() {
    this.showEditMode = false;
    // Refresh to get latest data
    this.checkForSelections();
  }

  onEditCompleted() {
    // When editing is completed successfully, exit edit mode and refresh the selection info
    this.showEditMode = false;
    this.checkForSelections();
  }

  onDraftSaved() {
    // When a new draft is saved, refresh the selection info to show the submit button
    this.checkForSelections();
  }

  getSelectionStatusText(): string {
    if (this.hasSubmittedSelection && this.submittedSelection) {
      switch (this.submittedSelection.status) {
        case 'pending':
          return 'Pending Admin Review';
        case 'approved':
          return 'Approved by Admin';
        case 'rejected':
          return 'Rejected by Admin';
        default:
          return 'Under Review';
      }
    }
    return '';
  }

  getSelectionStatusClass(): string {
    if (this.hasSubmittedSelection && this.submittedSelection) {
      switch (this.submittedSelection.status) {
        case 'pending':
          return 'status-pending';
        case 'approved':
          return 'status-approved';
        case 'rejected':
          return 'status-rejected';
        default:
          return 'status-pending';
      }
    }
    return '';
  }

  openSubmitModal() {
    this.previousSelectionDates = [...this.draftSelectionDates];
    this.showSubmitModal = true;
  }

  closeSubmitModal() {
    this.showSubmitModal = false;
  }

  confirmSubmit() {
    // TODO: Add your submit logic here
    this.showSubmitModal = false;
    this.isSubmitted = true;
    this.status = 'pending';
    this.hideEditAndSubmit = true;
    this.toastr.success('dates submitted for admin approval');
    this.submitForReview();
    // Optionally, start polling for approval status
    // setInterval(() => this.checkApprovalStatus(), 5000);
  }

  checkApprovalStatus() {
    this.dateService.getApprovalStatus(this.employeeId).subscribe({
      next: (response: any) => {
        if (response.status === 'approved') {
          this.status = 'approved';
        } else if (response.status === 'pending') {
          this.status = 'pending';
        } else {
          this.status = 'none';
        }
      },
      error: () => {
        // Optionally handle error
      }
    });
    //this.closeSubmitModal();
    this.submitForReview();
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateString(dateString: string): string {
    return this.formatDate(new Date(dateString));
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

  isNextMonth(): boolean {
    if (this.submittedSelection && this.submittedSelection.submittedAt) {
      const submittedDate = new Date(this.submittedSelection.submittedAt);
      const now = new Date();
      return submittedDate.getFullYear() === now.getFullYear() && submittedDate.getMonth() === now.getMonth() + 1;
    }
    return false;
  }
}
