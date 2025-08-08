import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private router: Router) { }

  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedUser = localStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  }

  login(user: User) {
    // Save to localStorage for persistence across page reloads
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  logout() {
    // Remove from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Method to refresh authentication state from localStorage (for SSR compatibility)
  refreshAuthState(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUser = this.getUserFromStorage();
      if (storedUser && !this.currentUserSubject.value) {
        this.currentUserSubject.next(storedUser);
      }
    }
  }
}
