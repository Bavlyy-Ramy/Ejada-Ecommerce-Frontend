import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../products/product.service';
import { UserService } from './user.service';
import { OrderService } from '../orders/order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  activeTab: 'products' | 'users' | 'orders' = 'products';

  products: any[] = [];
  productLoading = false;
  productError = '';
  productSuccess = '';

  showProductForm = false;
  editingProduct: any = null;   // null = Add mode, object = Edit mode
  productForm = { name: '', price: 0, stockQuantity: 0, description: '' };

  users: any[] = [];
  userLoading = false;
  userError = '';
  userSuccess = '';

  showUserForm = false;
  editingUser: any = null;  
  newUserRole: 'customer' | 'admin' = 'customer';
  userForm = { username: '', email: '', password: '', firstName: '', lastName: '' };
  isSuperAdmin = false;
  selectedUser: any = null;

  orders: any[] = [];
  orderLoading = false;
  orderError = '';
  orderSuccess = '';

  orderFilterStatus   = '';
  orderFilterUsername = '';
  orderFilterUserId   = '';
  orderFilterFrom     = '';
  orderFilterTo       = '';

  // Pagination
  orderPage     = 0;   // 0-based page index (Spring)
  orderPageSize = 10;
  orderTotal    = 0;   // total elements from backend
  get orderTotalPages(): number { return Math.ceil(this.orderTotal / this.orderPageSize); }

  statusOptions = ['', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  editingOrderStatus: { [id: number]: string } = {};

  constructor(
    private productService: ProductService,
    private userService: UserService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.loadProducts();
  }

  setTab(tab: 'products' | 'users' | 'orders'): void {
    this.activeTab = tab;
    if (tab === 'products') this.loadProducts();
    if (tab === 'users')    this.loadUsers();
    if (tab === 'orders')   this.loadOrders();
  }

  loadProducts(): void {
    this.productLoading = true;
    this.productError = '';
    this.productService.getProducts().subscribe({
      next: (p) => { this.products = p; this.productLoading = false; },
      error: () => { this.productError = 'Could not load products.'; this.productLoading = false; }
    });
  }

  openAddProduct(): void {
    this.editingProduct = null;
    this.productForm = { name: '', price: 0, stockQuantity: 0, description: '' };
    this.showProductForm = true;
    this.productSuccess = '';
    this.productError = '';
  }

  openEditProduct(product: any): void {
    this.editingProduct = product;
    this.productForm = {
      name: product.name,
      price: product.price,
      stockQuantity: product.stockQuantity,
      description: product.description || ''
    };
    this.showProductForm = true;
    this.productSuccess = '';
    this.productError = '';
  }

  cancelProductForm(): void {
    this.showProductForm = false;
  }

  saveProduct(): void {
    this.productError = '';
    this.productSuccess = '';
    const data = {
      name: this.productForm.name,
      price: this.productForm.price,
      stockQuantity: this.productForm.stockQuantity,
      description: this.productForm.description || undefined
    };

    if (this.editingProduct) {
      // Update existing product
      this.productService.updateProduct(this.editingProduct.id, data).subscribe({
        next: () => {
          this.productSuccess = 'Product updated!';
          this.showProductForm = false;
          this.loadProducts();
        },
        error: () => { this.productError = 'Could not update product.'; }
      });
    } else {
      // Add new product
      this.productService.addProduct(data).subscribe({
        next: () => {
          this.productSuccess = 'Product added!';
          this.showProductForm = false;
          this.loadProducts();
        },
        error: () => { this.productError = 'Could not add product.'; }
      });
    }
  }

  deleteProduct(id: number): void {
    if (!confirm('Soft-delete this product?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => { this.productSuccess = 'Product deleted.'; this.loadProducts(); },
      error: () => { this.productError = 'Could not delete product.'; }
    });
  }

  loadUsers(): void {
    this.userLoading = true;
    this.userError = '';
    this.userService.getAllUsers().subscribe({
      next: (u: any) => { this.users = u.content ?? u; this.userLoading = false; },
      error: () => { this.userError = 'Could not load users.'; this.userLoading = false; }
    });
  }

  openCreateUser(role: 'customer' | 'admin'): void {
    if (role === 'admin' && !this.isSuperAdmin) {
      this.userError = 'Only superadmin can create admin users.';
      return;
    }
    this.editingUser = null;
    this.newUserRole = role;
    this.userForm = { username: '', email: '', password: '', firstName: '', lastName: '' };
    this.showUserForm = true;
    this.userSuccess = '';
    this.userError = '';
  }

  openEditUser(user: any): void {
    this.editingUser = user;
    this.userForm = {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: ''   
    };
    this.showUserForm = true;
    this.userSuccess = '';
    this.userError = '';
  }

  cancelUserForm(): void {
    this.showUserForm = false;
  }

  saveUser(): void {
    this.userError = '';
    this.userSuccess = '';

    if (this.editingUser) {
      const data = {
        username: this.userForm.username,
        email: this.userForm.email,
        firstName: this.userForm.firstName,
        lastName: this.userForm.lastName
      };
      this.userService.updateUser(this.editingUser.id, data).subscribe({
        next: () => {
          this.userSuccess = 'User updated!';
          this.showUserForm = false;
          this.loadUsers();
        },
        error: () => { this.userError = 'Could not update user.'; }
      });
    } else {
      if (this.newUserRole === 'admin' && !this.isSuperAdmin) {
        this.userError = 'Only superadmin can create admin users.';
        return;
      }
      const data = { ...this.userForm };
      const call = this.newUserRole === 'admin'
        ? this.userService.createAdmin(data)
        : this.userService.createCustomer(data);

      call.subscribe({
        next: () => {
          this.userSuccess = `${this.newUserRole === 'admin' ? 'Admin' : 'Customer'} created!`;
          this.showUserForm = false;
          this.loadUsers();
        },
        error: () => { this.userError = 'Could not create user.'; }
      });
    }
  }

  deactivateUser(id: number): void {
    if (!confirm('Deactivate this user?')) return;
    this.userService.deactivateUser(id).subscribe({
      next: () => { this.userSuccess = 'User deactivated.'; this.loadUsers(); },
      error: () => { this.userError = 'Could not deactivate user.'; }
    });
  }

  loadOrders(): void {
    this.orderLoading = true;
    this.orderError = '';
    const filters: any = {
      page: this.orderPage,
      size: this.orderPageSize
    };
    if (this.orderFilterStatus)   filters.status   = this.orderFilterStatus;
    if (this.orderFilterUsername) filters.username = this.orderFilterUsername;
    if (this.orderFilterUserId)   filters.userId   = Number(this.orderFilterUserId);
    if (this.orderFilterFrom)     filters.from     = this.orderFilterFrom;
    if (this.orderFilterTo)       filters.to       = this.orderFilterTo;

    this.orderService.getAllOrders(filters).subscribe({
      next: (res) => {
        // Handle both paginated (Spring Page) and plain array responses
        if (res && res.content !== undefined) {
          this.orders    = res.content;
          this.orderTotal = res.totalElements ?? res.content.length;
        } else {
          this.orders    = Array.isArray(res) ? res : [];
          this.orderTotal = this.orders.length;
        }
        this.orders.forEach(o => { this.editingOrderStatus[o.id] = o.status; });
        this.orderLoading = false;
      },
      error: () => { this.orderError = 'Could not load orders.'; this.orderLoading = false; }
    });
  }

  applyOrderFilters(): void {
    this.orderPage = 0;  // reset to first page on new filter
    this.loadOrders();
  }

  clearOrderFilters(): void {
    this.orderFilterStatus = this.orderFilterUsername =
    this.orderFilterUserId = this.orderFilterFrom = this.orderFilterTo = '';
    this.orderPage = 0;
    this.loadOrders();
  }

  orderGoToPage(page: number): void {
    if (page < 0 || page >= this.orderTotalPages) return;
    this.orderPage = page;
    this.loadOrders();
  }

  updateOrderStatus(orderId: number): void {
    const status = this.editingOrderStatus[orderId];
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.orderSuccess = `Order #${orderId} status updated to ${status}.`;
        this.loadOrders();
      },
      error: () => { this.orderError = 'Could not update order status.'; }
    });
  }

  openUserDetail(user: any): void {
    this.selectedUser = user;
  }

  closeUserDetail(): void {
    this.selectedUser = null;
  }

  getUserInitials(user: any): string {
    const first = (user.firstName || user.username || '?')[0].toUpperCase();
    const last  = (user.lastName  || '')[0]?.toUpperCase() || '';
    return first + last;
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
