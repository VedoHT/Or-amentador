import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResultadoComparacao {
    ok: boolean;
    // acrescente campos reais depois (diffs, métricas, etc)
}

@Injectable({ providedIn: 'root' })
export class ComparacaoService {
    constructor(private http: HttpClient) {}

    // Troque este stub pelo seu endpoint real quando tiver:
    iniciar(payload: any): Observable<ResultadoComparacao> {
        // Exemplo fake: “processa” por 1.5s
        return timer(1500).pipe(map(() => ({ ok: true })));
        // Quando tiver a API:
        // return this.http.post<ResultadoComparacao>('/Comparacao/Iniciar', payload);
    }
}
