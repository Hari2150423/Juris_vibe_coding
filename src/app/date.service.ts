import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaveDateRequest {
  userId: number;
  employeeId: string;
  selectedDates: string[];
  userDesignation: string;
  userLocation: string;
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
  month: number;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  saveSelectedDates(data: SaveDateRequest): Observable<SaveDateResponse> {
    console.log('DateService: Making API call to save dates:', data);
    console.log('DateService: API URL:', `${this.apiUrl}/save-dates`);
    return this.http.post<SaveDateResponse>(`${this.apiUrl}/save-dates`, data);
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
}
