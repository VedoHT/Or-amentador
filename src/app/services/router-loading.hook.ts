// src/app/services/router-loading.hook.ts
import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class RouterLoadingHook {
    constructor(router: Router, loading: LoadingService) {
        router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => loading.start());
        router.events.pipe(filter(e => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError))
            .subscribe(() => loading.stop());
    }
}
