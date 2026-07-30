import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Build the set of headers to add
  let headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  req = req.clone({
    setHeaders: headers,
    // Append a unique timestamp so each GET is treated as a fresh request
    params: req.params.set('_t', Date.now().toString())
  });

  return next(req);
};

