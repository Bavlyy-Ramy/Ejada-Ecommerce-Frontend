import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  username = '';
  password = '';
  email = '';
  firstName = '';
  lastName = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService
      .register({
        username: this.username,
        password: this.password,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Account created! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1200);
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Could not create account. Try a different username.';
        }
      });
  }
}
