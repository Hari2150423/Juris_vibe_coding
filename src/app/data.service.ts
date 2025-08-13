import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';

interface DatabaseStructure {
  users: User[];
  admins: User[];
  selectedDates?: any[];
}

interface UserCreationData {
  name: string;
  employeeId: string;
  password: string;
  designation: string;
  location: string;
  role?: 'user' | 'admin';
}

interface UserUpdateData {
  name?: string;
  employeeId?: string;
  designation?: string;
  location?: string;
  role?: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dbUrl = 'assets/db.json';
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  getUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(this.dbUrl);
  }

  getAdmins(): Observable<{ admins: User[] }> {
    return this.http.get<{ admins: User[] }>(this.dbUrl);
  }

  // Get all data (users, admins, and selectedDates)
  getAllData(): Observable<DatabaseStructure> {
    return this.http.get<DatabaseStructure>(this.dbUrl);
  }

  // User Management Methods
  createUser(userData: UserCreationData): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  updateUser(userId: number, userData: UserUpdateData): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }
}
