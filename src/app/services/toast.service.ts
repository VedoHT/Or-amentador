import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    kind: ToastKind;
    text: string;
    timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private bus = new Subject<Toast>();
    stream$ = this.bus.asObservable();

    show(kind: ToastKind, text: string, timeout = environment.toast.autoHideMs) {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
        this.bus.next({ id, kind, text, timeout });
    }
    success(t: string, ms?: number) { this.show('success', t, ms); }
    error(t: string, ms?: number)   { this.show('error', t, ms); }
    warn(t: string, ms?: number)    { this.show('warning', t, ms); }
    info(t: string, ms?: number)    { this.show('info', t, ms); }
}
