import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../product.service';
import { Product } from '../product.model';
import { AuthService } from '../../auth/auth.service';
import { OrderService } from '../../orders/order.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  cartItems: Map<number, number> = new Map();
  orderSuccess = false;
  orderError = '';
  isPlacingOrder = false;
  isAdmin = false;
  userName = '';

  selectedProduct: Product | null = null;
  isModalLoading = false;
  showProfileModal = false;
  userRole = '';
  userRawUsername = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRoleFromToken();
    this.isAdmin = role === 'ADMIN' || role === 'SUPERADMIN' || (!!role && role.includes('ADMIN'));
    this.userName = this.authService.getUserName() || 'Customer';
    this.userRole = role || 'USER';
    this.userRawUsername = localStorage.getItem('username') || this.userName;
    this.loadProducts();
  }

  get userInitials(): string {
    if (!this.userName) return 'CU';
    const parts = this.userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.userName.substring(0, 2).toUpperCase();
  }

  stockLevel(stock: number): 'ok' | 'low' | 'out' {
    if (stock === 0) return 'out';
    if (stock < 10) return 'low';
    return 'ok';
  }

  stockLabel(stock: number): string {
    if (stock === 0) return 'Out of stock';
    if (stock < 10) return `Low · ${stock} left`;
    return `${stock} in stock`;
  }

  scrollToCart(): void {
    const cartEl = document.getElementById('cartSection');
    if (cartEl) {
      cartEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts(this.searchTerm).subscribe({
      next: (products) => {
        this.products = products;
        // Keep selectedProduct in sync if modal is open
        if (this.selectedProduct) {
          const updated = products.find((p) => p.id === this.selectedProduct?.id);
          if (updated) {
            this.selectedProduct = { ...this.selectedProduct, ...updated };
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load products.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  openProductModal(product: Product, event?: MouseEvent): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (target.closest('.cart-controls') || target.closest('.qty-controls') || target.tagName === 'BUTTON') {
        return;
      }
    }

    this.selectedProduct = { ...product };
    this.isModalLoading = true;

    this.productService.getProductById(product.id).subscribe({
      next: (fullProduct) => {
        if (fullProduct) {
          this.selectedProduct = fullProduct;
        }
        this.isModalLoading = false;
      },
      error: () => {
        this.isModalLoading = false;
      }
    });
  }

  closeProductModal(): void {
    this.selectedProduct = null;
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  getCartCount(productId: number): number {
    return this.cartItems.get(productId) ?? 0;
  }

  get totalCartItems(): number {
    let total = 0;
    this.cartItems.forEach((qty) => (total += qty));
    return total;
  }

  // Total price
  get cartTotal(): number {
    let total = 0;
    this.products.forEach((p) => {
      const qty = this.cartItems.get(p.id) ?? 0;
      total += p.price * qty;
    });
    return total;
  }

  // Returns cart as a simple array for the template to loop over
  get cartLines(): { product: Product; quantity: number; subtotal: number }[] {
    const lines: { product: Product; quantity: number; subtotal: number }[] = [];
    this.cartItems.forEach((quantity, productId) => {
      const product = this.products.find((p) => p.id === productId);
      if (product) {
        lines.push({ product, quantity, subtotal: product.price * quantity });
      }
    });
    return lines;
  }

  addToCart(product: Product): void {
    const current = this.cartItems.get(product.id) ?? 0;
    if (current < product.stockQuantity) {
      this.cartItems.set(product.id, current + 1);
    }
  }

  removeFromCart(productId: number): void {
    const current = this.cartItems.get(productId) ?? 0;
    if (current <= 1) {
      this.cartItems.delete(productId);
    } else {
      this.cartItems.set(productId, current - 1);
    }
  }

  removeAll(productId: number): void {
    this.cartItems.delete(productId);
  }

  placeOrder(): void {
    const items: { productId: number; quantity: number }[] = [];
    this.cartItems.forEach((quantity, productId) => {
      items.push({ productId, quantity });
    });

    this.isPlacingOrder = true;
    this.orderError = '';
    this.orderSuccess = false;

    this.orderService.placeOrder(items).subscribe({
      next: () => {
        this.orderSuccess = true;
        this.cartItems.clear(); // empty the cart after a successful order
        this.isPlacingOrder = false;
        this.loadProducts(); // Update product stock UI from backend after order
      },
      error: () => {
        this.orderError = 'Could not place order. Please try again.';
        this.isPlacingOrder = false;
      }
    });
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
