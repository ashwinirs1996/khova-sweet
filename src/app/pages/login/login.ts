import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected username = '';
  protected password = '';
  protected readonly showPassword = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    const err = await this.auth.login(this.username, this.password);
    this.busy.set(false);
    if (err) {
      this.error.set(err);
      return;
    }
    this.router.navigate(['/']);
  }
}
