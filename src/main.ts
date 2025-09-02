import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNgxMask } from 'ngx-mask';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiInterceptor } from './app/interceptors/api.interceptor';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';

// registre alguns locais comuns (adicione outros se precisar)
import localePt from '@angular/common/locales/pt';
import localePtExtra from '@angular/common/locales/extra/pt';
import localeEn from '@angular/common/locales/en';
import localeEnExtra from '@angular/common/locales/extra/en';
import localeEs from '@angular/common/locales/es';
import localeEsExtra from '@angular/common/locales/extra/es';
import { LoadingInterceptor } from './app/interceptors/loading.interceptor';

// registra
registerLocaleData(localePt, 'pt', localePtExtra);
registerLocaleData(localeEn, 'en', localeEnExtra);
registerLocaleData(localeEs, 'es', localeEsExtra);

// escolhe o locale do navegador (fallback en-US)
function browserLocale(): string {
  const l = (navigator.languages && navigator.languages[0]) || navigator.language || 'en-US';
  // normaliza: 'pt-BR' -> 'pt', 'en-US' -> 'en', etc.
  const base = l.split('-')[0].toLowerCase();
  return base === 'pt' ? 'pt' : base === 'es' ? 'es' : 'en';
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(FormsModule, ReactiveFormsModule, HttpClientModule),
    provideNgxMask({ dropSpecialCharacters: true }),
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
    { provide: LOCALE_ID, useFactory: browserLocale }
  ]
}).catch(err => console.error(err));
