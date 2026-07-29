# E-Commerce Frontend (Angular)

A minimal Angular app with two pages:

- **Login** (`/login`) — logs in against `POST /api/auth/login`, saves the JWT in `localStorage`.
- **Products** (`/products`) — lists products from `GET /api/products`, with a search box that filters by name (`GET /api/products?name=...`). Protected — you're redirected to `/login` if you're not logged in.

## How it's organized

```
src/app/
  auth/
    auth.service.ts        <- login/logout, stores the token
    auth.guard.ts           <- blocks /products if not logged in
    auth.interceptor.ts     <- attaches "Authorization: Bearer <token>" to every request
    login/                  <- login page (component + html + css)
  products/
    product.model.ts        <- Product interface (id, name, price, stockQuantity)
    product.service.ts      <- calls GET /api/products
    product-list/           <- products page (component + html + css)
  app.routes.ts              <- the 2 routes
  app.config.ts               <- wires up router + http client
```

No NgModules, no NgRx, no reactive forms — just standalone components, `ngModel` for the
form inputs, and plain `.subscribe()` calls. Everything is in one component + one service
per feature, so it should be easy to follow even if you're new to Angular.

## Setup

1. Make sure your Spring Boot backend is running on `http://localhost:8080`.
   If it runs elsewhere, change `apiUrl` in `src/environments/environment.ts`.

2. Install dependencies:
   ```
   npm install
   ```

3. Run the app:
   ```
   npm start
   ```
   This runs `ng serve`. Open `http://localhost:4200`.

## A couple of things you may need to tweak

- **Login response field name**: `auth.service.ts` looks for `token`, `accessToken`, or `jwt`
  in the login response. If your backend uses a different field name, update that line.
- **CORS**: if you get CORS errors in the browser console, your Spring Boot backend needs to
  allow requests from `http://localhost:4200` (e.g. `@CrossOrigin` or a global CORS config).
- **Product list shape**: `product.service.ts` handles both a plain array response and a
  paginated Spring Data response (`{ content: [...] }`). No change needed either way.

## Next steps (when you have time)

- Register page
- Pagination on the product list
- Cart / checkout
- Route guard redirect back to the page the user was trying to reach
