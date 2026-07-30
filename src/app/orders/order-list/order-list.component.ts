import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../order.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders: any[] = [];
  isLoading = false;
  errorMessage = '';

  isAdmin = false;

  filterStatus = '';

  filterUsername = '';
  filterUserId = '';
  filterFrom = '';
  filterTo = '';

  statusOptions = ['', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  userName = '';

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRoleFromToken();
    this.isAdmin = role === 'ADMIN' || role === 'SUPERADMIN' || (!!role && role.includes('ADMIN'));
    this.userName = this.authService.getUserName() || 'Customer';
    this.loadOrders();
  }

  get userInitials(): string {
    if (!this.userName) return 'CU';
    const parts = this.userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.userName.substring(0, 2).toUpperCase();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isAdmin) {
      const filters: any = {};
      if (this.filterStatus)   filters.status   = this.filterStatus;
      if (this.filterUsername) filters.username = this.filterUsername;
      if (this.filterUserId)   filters.userId   = Number(this.filterUserId);
      if (this.filterFrom)     filters.from     = this.filterFrom;
      if (this.filterTo)       filters.to       = this.filterTo;

      this.orderService.getAllOrders(filters).subscribe({
        next: (res) => {
          this.orders = res.content ?? res;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Could not load orders.';
          this.isLoading = false;
        }
      });
    } else {
      const filters: any = {};
      if (this.filterStatus) filters.status = this.filterStatus;

      this.orderService.getMyOrders(filters).subscribe({
        next: (res) => {
          this.orders = res.content ?? res;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Could not load orders.';
          this.isLoading = false;
        }
      });
    }
  }

  onFilter(): void {
    this.loadOrders();
  }

  clearFilters(): void {
    this.filterStatus   = '';
    this.filterUsername = '';
    this.filterUserId   = '';
    this.filterFrom     = '';
    this.filterTo       = '';
    this.loadOrders();
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
