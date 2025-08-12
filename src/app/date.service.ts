import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaveDateRequest {
  userId: number;
  employeeId: string;
  selectedDates: string[];
  userDesignation: string;
  userLocation: string;
  attachment?: File | string | null;
}

export interface SaveDateResponse {
  message: string;
  savedDates: number;
  record: any;
}

export interface UserDateRecord {
  id: number;
  userId: number;
  employeeId: string;
  userDesignation: string;
  userLocation: string;
  selectedDates: string[];
  savedAt: string;
  submittedAt?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  month: number;
  year: number;
  attachment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  saveSelectedDates(data: SaveDateRequest): Observable<SaveDateResponse> {
    const formData = new FormData();
    formData.append('userId', data.userId.toString());
    formData.append('employeeId', data.employeeId);
    formData.append('selectedDates', JSON.stringify(data.selectedDates));
    formData.append('userDesignation', data.userDesignation);
    formData.append('userLocation', data.userLocation);
    if (data.attachment && data.attachment instanceof File) {
      formData.append('attachment', data.attachment);
    }
    return this.http.post<SaveDateResponse>(`${this.apiUrl}/save-draft`, formData);
  }

  submitForReview(employeeId: string): Observable<SaveDateResponse> {
    console.log('DateService: Making API call to submit for review:', employeeId);
    return this.http.post<SaveDateResponse>(`${this.apiUrl}/submit-for-review`, { employeeId });
  }

  getUserDraftDates(employeeId: string): Observable<UserDateRecord> {
    return this.http.get<UserDateRecord>(`${this.apiUrl}/get-draft/${employeeId}`);
  }

  getUserSubmittedDates(employeeId: string): Observable<UserDateRecord> {
    return this.http.get<UserDateRecord>(`${this.apiUrl}/get-submitted/${employeeId}`);
  }

  // Admin functions
  getSubmittedSelections(): Observable<UserDateRecord[]> {
    return this.http.get<UserDateRecord[]>(`${this.apiUrl}/submitted-selections`);
  }

  approveSelection(selectionId: number, adminComment?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-selection`, { selectionId, adminComment });
  }

  rejectSelection(selectionId: number, adminComment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reject-selection`, { selectionId, adminComment });
  }

  getUserSavedDates(employeeId: string): Observable<UserDateRecord> {
    return this.http.get<UserDateRecord>(`${this.apiUrl}/get-dates/${employeeId}`);
  }

  getAllSavedDates(): Observable<UserDateRecord[]> {
    return this.http.get<UserDateRecord[]>(`${this.apiUrl}/all-saved-dates`);
  }

  getApprovalStatus(employeeId: string): Observable<any> {
    // Placeholder: implement actual backend call
    return this.http.get<any>(`${this.apiUrl}/approval-status/${employeeId}`);
  }

  getUsersNotSubmitted(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users-not-submitted`);
  }

  getUserApprovedDates(employeeId: string): Observable<UserDateRecord[]> {
    return this.http.get<UserDateRecord[]>(`${this.apiUrl}/get-approved/${employeeId}`);
  }
}
