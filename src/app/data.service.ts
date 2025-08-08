import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';

interface DatabaseStructure {
  users: User[];
  admins: User[];
  selectedDates?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dbUrl = 'assets/db.json';

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
}
