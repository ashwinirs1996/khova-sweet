import { Injectable, signal } from '@angular/core';

export interface Toast {
  text: string;
  error: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<Toast | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(text: string, error = false): void {
    this.message.set({ text, error });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 2800);
  }

  error(text: string): void {
    this.show(text, true);
  }
}
