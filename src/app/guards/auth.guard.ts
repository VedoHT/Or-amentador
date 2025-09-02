import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) return true;

    // se não estiver logado, manda pro /login e guarda a URL desejada
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};
