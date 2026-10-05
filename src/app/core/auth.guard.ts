import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Note: inject() must run before the first await — it only works in the synchronous part of the guard.

/** Only logged-in users can see the app. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.isLoggedIn()) || router.createUrlTree(['/login']);
};

/** Logged-in users skip the login page. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return !(await auth.isLoggedIn()) || router.createUrlTree(['/']);
};
