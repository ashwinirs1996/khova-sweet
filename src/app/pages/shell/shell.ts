import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  try {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Logged-in layout: header, page tabs, and the routed page. Loads all data once. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly data = inject(DataService);
  protected readonly theme = signal<Theme>(readTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.dataset['theme'] = t;
      try {
        localStorage.setItem('theme', t);
      } catch {
        // storage unavailable — theme just won't persist
      }
    });
  }

  ngOnInit(): void {
    this.data.loadAll();
  }

  protected toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
