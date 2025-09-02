import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const isUnsafe = ['POST', 'PUT', 'DELETE'].includes(req.method);

        let clone = req.clone({ withCredentials: true });

        if (isUnsafe) {
            let token = localStorage.getItem('csrf');
            if (!token) { token = crypto.randomUUID(); localStorage.setItem('csrf', token); }
            clone = clone.clone({ setHeaders: { 'X-CSRF-TOKEN': token } });
        }

        return next.handle(clone);
    }
}
