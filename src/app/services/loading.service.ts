import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    private activeCount = 0;
    private active$ = new BehaviorSubject<number>(0);

    private showDelayMs = 150;   // evita flicker
    private minVisibleMs = 300;  // tempo mínimo visível

    readonly isLoading$: Observable<boolean> = this.active$.pipe(
        map((n) => n > 0),
        distinctUntilChanged(),
        switchMap((is) => is ? timer(this.showDelayMs).pipe(map(() => true))
            : timer(this.minVisibleMs).pipe(map(() => false))),
        distinctUntilChanged()
    );

    start() { this.activeCount++; this.active$.next(this.activeCount); }
    stop()  { this.activeCount = Math.max(0, this.activeCount - 1); this.active$.next(this.activeCount); }
}
