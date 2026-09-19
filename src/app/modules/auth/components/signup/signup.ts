import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'app/core/services/auth.service';

function matchesPassword(control: AbstractControl): ValidationErrors | null {
  return control.value === control.parent?.get('password')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  templateUrl: './signup.html',
})
export class Signup {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, matchesPassword]],
  });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  constructor() {
    this.form.controls.password.valueChanges.subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.authService.signup(name.trim(), email.trim(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Could not create your account.');
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
