import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">grass</mat-icon>
          <mat-card-title>LawnCare</mat-card-title>
          <mat-card-subtitle>Yard Management & GDD Tracking</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            @if (isRegister()) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Display Name</mat-label>
                <input matInput formControlName="displayName" autocomplete="name" />
                @if (form.controls.displayName.hasError('required')) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email" />
              @if (form.controls.email.hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (form.controls.email.hasError('email')) {
                <mat-error>Invalid email format</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="hidePassword() ? 'password' : 'text'"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.update((v) => !v)"
                [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
                [matTooltip]="hidePassword() ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              } @else if (form.controls.password.hasError('minlength')) {
                <mat-error>Password must be at least 6 characters</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error-text" role="alert">{{ errorMessage() }}</p>
            }

            <button
              mat-flat-button
              type="submit"
              class="full-width login-button"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                {{ isRegister() ? 'Create Account' : 'Sign In' }}
              }
            </button>
          </form>

          <button
            mat-button
            class="full-width toggle-button"
            (click)="toggleMode()"
          >
            {{ isRegister() ? 'Already have an account? Sign In' : 'Need an account? Register' }}
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--login-gradient);
      padding: 16px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--login-icon-color);
    }

    .full-width {
      width: 100%;
    }

    .login-button {
      margin-top: 8px;
      height: 48px;
    }

    .toggle-button {
      margin-top: 8px;
    }

    .error-text {
      color: #d32f2f;
      font-size: 14px;
      margin: 0 0 8px;
    }

    form {
      display: flex;
      flex-direction: column;
      margin-top: 16px;
    }
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isRegister = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected toggleMode(): void {
    this.isRegister.update((v) => !v);
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isRegister() && !this.form.controls.displayName.value.trim()) {
      this.errorMessage.set('Display name is required for registration.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const { email, password, displayName } = this.form.getRawValue();

    try {
      if (this.isRegister()) {
        await this.authService.register(email, password, displayName.trim());
      } else {
        await this.authService.login(email, password);
      }
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
