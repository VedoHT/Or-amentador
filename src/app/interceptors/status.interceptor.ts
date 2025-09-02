import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { LoginService } from '../services/login.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

function extractMsg(body: any, fallback: string) {
  try {
    if (!body) return fallback;
    if (typeof body === 'string') {
      // às vezes backend devolve text/plain
      return body;
    }
    return body.mensagem || body.message || fallback;
  } catch {
    return fallback;
  }
}

@Injectable()
export class StatusInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
      private toast: ToastService,
      private auth: AuthService,
      private login: LoginService,
      private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // sempre withCredentials para enviar cookies HttpOnly
    const cloned = req.clone({ withCredentials: true });

    return next.handle(cloned).pipe(
        // SUCESSO: mostra toast se vier mensagem no body
        tap(evt => {
          if (evt instanceof HttpResponse) {
            const body: any = evt.body;
            // só mostra toast se houver mensagem explícita do backend
            const msg = extractMsg(body, '');
            if (evt.status >= 200 && evt.status < 300 && msg) {
              this.toast.success(msg);
            }
          }
        }),

        // ERRO: trata por status e garante toast
        catchError((err: HttpErrorResponse) => {
          // status 0 = erro de rede/CORS
          if (err.status === 0) {
            this.toast.error('Falha de conexão. Verifique sua rede.');
            return throwError(() => err);
          }

          // tenta extrair mensagem do backend (mesmo se text/plain)
          const msg = extractMsg(err.error, `Erro ${err.status}`);

          if (err.status === 401) {
            // somente tenta refresh se configurado e não estiver em refresh
            if (!this.isRefreshing && environment.refreshPath) {
              this.isRefreshing = true;
              return this.login.Refresh().pipe(
                  switchMap(() => {
                    this.isRefreshing = false;
                    // reexecuta a requisição original
                    return next.handle(cloned);
                  }),
                  catchError(inner => {
                    this.isRefreshing = false;
                    this.toast.info('Sessão expirada. Faça login novamente.');
                    this.auth.logoutLocal();
                    this.router.navigate(['/login']);
                    return throwError(() => inner);
                  })
              );
            } else {
              this.toast.info('Não autorizado. Faça login.');
              this.auth.logoutLocal();
              this.router.navigate(['/login']);
            }
          } else if (err.status === 412) {
            // PRECONDITION FAILED -> warning
            this.toast.warn(msg || 'Pré-condição não atendida.');
          } else if (err.status >= 400 && err.status < 500) {
            this.toast.error(msg);
          } else if (err.status >= 500) {
            this.toast.error(msg || 'Erro interno do servidor.');
          }

          return throwError(() => err);
        })
    );
  }
}
