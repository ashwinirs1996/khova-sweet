import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { USERNAME_DOMAIN } from './config';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly db = inject(SupabaseService).client;
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly username = computed(() => this.user()?.email?.split('@')[0] ?? '');

  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.db.auth.getSession().then(({ data }) => this.user.set(data.session?.user ?? null));
    this.db.auth.onAuthStateChange((event, session) => {
      this.user.set(session?.user ?? null);
      if (event === 'SIGNED_OUT') this.router.navigate(['/login']);
    });
  }

  async isLoggedIn(): Promise<boolean> {
    await this.ready;
    return !!this.user();
  }

  /** Returns an error message, or null on success. */
  async login(username: string, password: string): Promise<string | null> {
    const u = username.trim().toLowerCase();
    const email = u.includes('@') ? u : `${u}@${USERNAME_DOMAIN}`;
    const { error } = await this.db.auth.signInWithPassword({ email, password });
    return error ? 'Invalid username or password' : null;
  }

  async logout(): Promise<void> {
    await this.db.auth.signOut();
    this.router.navigate(['/login']);
  }
}
