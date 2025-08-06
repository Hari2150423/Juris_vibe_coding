import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit {
  isHomePage = false;
  sidebarOpen = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Listen to router events to detect when we're on the home page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isHomePage = event.url === '/home';
        // Close sidebar when navigating away from home
        if (!this.isHomePage) {
          this.sidebarOpen = false;
        }
      });
    
    // Check initial route
    this.isHomePage = this.router.url === '/home';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}
