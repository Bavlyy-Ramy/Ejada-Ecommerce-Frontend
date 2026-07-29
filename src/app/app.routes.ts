import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ProductListComponent } from './products/product-list/product-list.component';
import { OrderListComponent } from './orders/order-list/order-list.component';
import { AdminComponent } from './admin/admin.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'products', component: ProductListComponent, canActivate: [authGuard] },
  { path: 'orders',   component: OrderListComponent,  canActivate: [authGuard] },
  { path: 'admin',    component: AdminComponent,      canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
