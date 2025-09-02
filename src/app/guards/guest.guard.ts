import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // se já estiver logado, pula o /login e manda pra "Meus Orçamentos"
    if (auth.isLoggedIn()) {
        return router.createUrlTree(['/meus']);
    }
    return true;
};
