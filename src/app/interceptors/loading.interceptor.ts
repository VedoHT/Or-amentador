import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    private readonly ignore: (string | RegExp)[] = [
        /\/assets\//,
        /\/health$/,
    ];

    constructor(private loading: LoadingService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const skip = this.ignore.some((p) => typeof p === 'string' ? req.url.includes(p) : p.test(req.url));
        if (!skip) this.loading.start();
        return next.handle(req).pipe(finalize(() => { if (!skip) this.loading.stop(); }));
    }
}
