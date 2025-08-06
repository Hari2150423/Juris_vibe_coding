import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeSidebar.emit(); // Close sidebar after navigation
  }

  onCloseSidebar() {
    this.closeSidebar.emit();
  }
}
