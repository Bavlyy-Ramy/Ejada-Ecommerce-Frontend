# E-Commerce Frontend — Project Overview

> **Angular 17+ · Standalone Components · JWT Auth · Role-Based Access**
> Prepared for mentor presentation — July 2026

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Angular 17+** (standalone component API, no NgModules) |
| Language | **TypeScript** |
| HTTP | Angular `HttpClient` with a functional interceptor |
| Routing | Angular Router with route guards |
| Styling | **Vanilla CSS** with a shared design token system |
| Fonts | Space Grotesk · Inter · JetBrains Mono (Google Fonts) |
| State | Component-level (no NgRx / external state library) |
| Auth | **JWT** stored in `localStorage` |
| Build tool | Angular CLI (`ng serve` / `ng build`) |

---

## 2. Project Structure

```
src/
├── app/
│   ├── app.component.ts         # Root component (<router-outlet>)
│   ├── app.config.ts            # Bootstrap: Router + HttpClient + Interceptor
│   ├── app.routes.ts            # All route definitions
│   │
│   ├── auth/
│   │   ├── auth.service.ts      # Login, register, JWT decode, role helpers
│   │   ├── auth.guard.ts        # Route guard — blocks unauthenticated access
│   │   ├── auth.interceptor.ts  # Attaches Bearer token to every HTTP request
│   │   ├── login/               # Login page component
│   │   └── register/            # Register page component
│   │
│   ├── products/
│   │   ├── product.model.ts     # Product interface (id, name, price, stock, description)
│   │   ├── product.service.ts   # CRUD API calls for products
│   │   └── product-list/        # Main catalog page (shopping + cart)
│   │
│   ├── orders/
│   │   ├── order.service.ts     # Place order, get my orders, get all orders (admin)
│   │   └── order-list/          # Order history page
│   │
│   └── admin/
│       ├── user.service.ts      # User CRUD API calls
│       └── admin.component      # Admin dashboard (Products / Users / Orders tabs)
│
├── environments/
│   └── environment.ts           # apiUrl base URL
│
├── styles.css                   # Global CSS variables + resets
└── index.html                   # Google Fonts import, <app-root>
```

---

## 3. Routing Map

```
/                →  redirects to /login
/login           →  LoginComponent       (public)
/register        →  RegisterComponent    (public)
/products        →  ProductListComponent (🔒 authGuard)
/orders          →  OrderListComponent   (🔒 authGuard)
/admin           →  AdminComponent       (🔒 authGuard)
/**              →  redirects to /login
```

> **authGuard** — a functional guard that checks `AuthService.isLoggedIn()`.
> If `localStorage` has no JWT token it redirects to `/login`.

---

## 4. Authentication Flow

```
User enters username + password
        ↓
POST /auth/login  (AuthService.login)
        ↓
Backend returns { token, role, firstName, username }
        ↓
AuthService stores in localStorage:
  - auth_token   → JWT used for API calls
  - user_role    → ADMIN / USER / SUPERADMIN
  - user_name    → display name (firstName or username)
  - username     → raw login username
        ↓
Router navigates to /products
```

### JWT Interceptor

Every outgoing `HttpClient` request is automatically intercepted by `authInterceptor`:

```typescript
// auth.interceptor.ts
req = req.clone({
  setHeaders: { Authorization: `Bearer ${token}` }
});
```

No individual service needs to manually set the auth header.

### AuthService Key Methods

| Method | What it does |
|---|---|
| `login(username, password)` | Calls POST /auth/login, stores token & role |
| `logout()` | Clears all localStorage keys |
| `isLoggedIn()` | Checks if JWT token exists |
| `getRoleFromToken()` | Decodes JWT payload → returns `ADMIN`, `SUPERADMIN`, or `USER` |
| `getUserName()` | Returns display name from localStorage or JWT |
| `isSuperAdmin()` | Returns true if role === `SUPERADMIN` |

---

## 5. Pages & Components

### 5.1 Login Page (`/login`)

- Simple form with Username + Password fields
- Calls `AuthService.login()` → on success navigates to `/products`
- Shows error alert on failed login
- "Create account" link → `/register`
- Design: dark header with barcode stripe, amber submit button

### 5.2 Register Page (`/register`)

- Fields: username, email, password, first name, last name
- Calls `AuthService.register()` — always creates a `USER` role account
- On success navigates to `/login`

---

### 5.3 Product List Page (`/products`) — Main Customer View

**Purpose:** Browse the catalog, manage a cart, and place orders.

#### Toolbar
| Element | Behaviour |
|---|---|
| Brand "Products · Inventory" | Static branding |
| 🛒 Cart pill | Click → smooth-scrolls to the cart section |
| User chip (avatar + name) | **Click → opens "My Profile" modal popup** |
| Admin panel button | Visible only to ADMIN/SUPERADMIN roles |
| My orders button | Navigates to `/orders` |
| Log out button | Calls `AuthService.logout()` → `/login` |

#### Product Grid
- Loaded from `GET /api/products` via `ProductService.getProducts()`
- Optional `?name=` search query supported
- Each card shows: name, price, stock LED indicator, stock label
- **Clicking a card** → opens a **Product Detail Modal** with full info + description
- Stock states: `ok` (≥10), `low` (1–9, amber), `out` (0, red + disabled button)

#### Cart (in-page)
- **Client-side only** — stored in a `Map<productId, quantity>` in the component
- Shows when at least 1 item is added
- Quantity controls (+/−) capped at current stock
- Calculates subtotal per line and total

#### Placing an Order
```
Click "Place Order"
      ↓
POST /api/orders  with { items: [{ productId, quantity }] }
      ↓
Cart cleared → products reloaded (stock updated from backend)
```

#### My Profile Modal
- Triggered by clicking the user chip
- Shows: initials avatar, username, display name, role chip
- "My Orders" shortcut in footer

---

### 5.4 Order List Page (`/orders`)

**Purpose:** View order history — different for customers vs admins.

#### Role-aware behaviour

| Feature | Customer | Admin |
|---|---|---|
| Data source | `GET /api/orders/my` | `GET /api/orders` (all orders) |
| Customer column | Hidden | Shown |
| Username filter | Hidden | Shown |
| User ID filter | Hidden | Shown |
| Date range filters | Hidden | Shown |

#### Filters
- Status: PENDING / SHIPPED / DELIVERED / CANCELLED / All
- Admin extras: username search, user ID, from/to date range
- "Apply Filters" calls `OrderService.getAllOrders(filters)` or `getMyOrders(filters)`

#### Table
- Order ID, Customer (admin), Date, Status badge (colored dot), Items (pill tags), Total Amount

---

### 5.5 Admin Dashboard (`/admin`)

**Purpose:** Full CRUD management for admins. Three tabs.

#### Tab 1 — Products
- List all products in a table (ID, Name, Price, Stock badge, Actions)
- **+ Add Product** → inline form card with barcode stripe (Name, Price, Stock, Description)
- **Edit** → same form pre-filled
- **Delete** → soft-delete via `DELETE /api/products/:id`
- Stock shown as colored badge: green (≥10), amber (1–9), red (out)

#### Tab 2 — Users
- List all users (ID, Username, Email, Role badge, Active badge, Actions)
- **Click on a username** → opens **User Detail Popup** (avatar, full name, email, role, status)
- **+ Create Customer** → `POST /api/users/customer`
- **+ Create Admin** → `POST /api/users/admin` *(SUPERADMIN only)*
- **Edit** → updates username, email, first/last name
- **Deactivate** → `PUT /api/users/deactivate/:id` (button disabled if already inactive)

#### Tab 3 — Orders
- Filter bar: status, username, user ID, from/to date
- Table: Order ID, Customer, Date, Items (pill tags), Total, Status badge
- **Inline status update**: dropdown per row + Save → `PUT /api/orders/:id/status`
- Visible statuses: PENDING, SHIPPED, DELIVERED, CANCELLED

---

## 6. Services (API Layer)

### ProductService  (`products/product.service.ts`)

| Method | HTTP | Endpoint |
|---|---|---|
| `getProducts(name?)` | GET | `/api/products?name=` |
| `getProductById(id)` | GET | `/api/products/:id` |
| `addProduct(data)` | POST | `/api/products` |
| `updateProduct(id, data)` | PUT | `/api/products/:id` |
| `deleteProduct(id)` | DELETE | `/api/products/:id` |

### OrderService (`orders/order.service.ts`)

| Method | HTTP | Endpoint |
|---|---|---|
| `placeOrder(items)` | POST | `/api/orders` |
| `getMyOrders(filters)` | GET | `/api/orders/my` |
| `getAllOrders(filters)` | GET | `/api/orders` |
| `updateOrderStatus(id, status)` | PUT | `/api/orders/:id/status` |

### UserService (`admin/user.service.ts`)

| Method | HTTP | Endpoint |
|---|---|---|
| `getAllUsers()` | GET | `/api/users` |
| `getUserById(id)` | GET | `/api/users/:id` |
| `createCustomer(data)` | POST | `/api/users/customer` |
| `createAdmin(data)` | POST | `/api/users/admin` |
| `updateUser(id, data)` | PUT | `/api/users/:id` |
| `deactivateUser(id)` | PUT | `/api/users/deactivate/:id` |

---

## 7. Design System

All pages share a consistent visual language defined in `src/styles.css`:

### CSS Variables (Design Tokens)

```css
--ink:        #161B22   /* dark navy — primary background/text */
--ink-soft:   #232B36   /* slightly lighter dark */
--paper:      #F1F2F5   /* light grey — page background */
--card:       #FFFFFF   /* white cards */
--amber:      #F0A500   /* primary accent color */
--amber-deep: #C77F00   /* amber hover state */
--green:      #2F9E44   /* success / in-stock */
--amber-warn: #E8A317   /* low stock warning */
--red:        #E03131   /* error / out-of-stock / destructive */
--muted:      #5B6472   /* secondary text */
--border:     #E2E4E8   /* card/table borders */
--radius:     10px      /* standard border radius */
```

### Typography

| Font | Usage |
|---|---|
| **Space Grotesk** (700) | Page titles, card names, modal headings |
| **Inter** (400–700) | Body text, buttons, labels |
| **JetBrains Mono** (400–700) | Prices, IDs, stock values, filter labels, badges |

### Recurring UI Patterns

- **Barcode stripe** — decorative header on cards and form panels
- **LED dot** — colored status indicator (green/amber/red)
- **Status badge** — pill with colored dot for order statuses
- **Count badge** — monospace pill showing item counts
- **Alert box** — success/error messages with colored dot + border
- **Modal** — blurred backdrop + slide-up animation, barcode header stripe

---

## 8. Role-Based Access Summary

| Feature | Customer (USER) | Admin (ADMIN) | Super Admin (SUPERADMIN) |
|---|---|---|---|
| Browse products | ✅ | ✅ | ✅ |
| Add to cart + place order | ✅ | ✅ | ✅ |
| View my orders | ✅ | ✅ | ✅ |
| View all orders | ❌ | ✅ | ✅ |
| Update order status | ❌ | ✅ | ✅ |
| Admin panel button visible | ❌ | ✅ | ✅ |
| Manage products (CRUD) | ❌ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ✅ |
| Create admin accounts | ❌ | ❌ | ✅ |

---

## 9. Data Flow Diagram

```
Browser (Angular SPA)
      │
      │  HTTP requests (JSON)
      │  + Authorization: Bearer <JWT>
      ↓
Spring Boot REST API  (/api/...)
      │
      ↓
Database (PostgreSQL / MySQL)
```

**Angular-side flow for a typical page load:**

```
Route activated
      ↓
authGuard checks localStorage for JWT
      ↓ (if valid)
Component.ngOnInit() fires
      ↓
Service.getSomething().subscribe(...)
      ↓
authInterceptor clones request + adds Authorization header
      ↓
HTTP response arrives
      ↓
Component updates its properties
      ↓
Angular's change detection re-renders the template
```

---

## 10. Key Angular Concepts Used

| Concept | Where used |
|---|---|
| **Standalone Components** | Every component — no `NgModule` |
| **`CommonModule`** | `*ngIf`, `*ngFor`, `| date`, `| number`, `| titlecase` pipes |
| **`FormsModule`** | Two-way binding `[(ngModel)]` on all form inputs |
| **`RouterModule` / `routerLink`** | Navigation in login/register templates |
| **`HttpClient`** | All API calls in services |
| **Functional Route Guard** | `authGuard` — modern Angular 14+ style |
| **Functional HTTP Interceptor** | `authInterceptor` — modern Angular 15+ style |
| **`@Injectable({ providedIn: 'root' })`** | All services are singleton, tree-shakable |
| **`HostListener` / click outside** | Modal close on backdrop click via `$event.stopPropagation()` |
| **`[class.x]` binding** | Dynamic CSS classes (e.g. stock level, status badge) |

---

## 11. Summary — What the App Does

This is a **full-featured e-commerce frontend** that connects to a Spring Boot backend API. It provides:

1. **Authentication** — JWT-based login/register with role detection
2. **Product catalog** — searchable grid with real-time stock status
3. **Shopping cart** — client-side cart with quantity controls
4. **Order placement** — submits cart to the backend, updates stock
5. **Order history** — filtered view for customers and admins
6. **Admin dashboard** — full CRUD for products, users, and orders with role-gated features
7. **User detail popups** — click any username to see full profile info
8. **Consistent design system** — dark ink toolbar, amber accents, monospace data, smooth modals
