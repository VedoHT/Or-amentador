import { HttpClient, HttpHeaders } from '@angular/common/http';
import {CalcularFreteRequest, CriarOrcamentoResponse, FreteQuote, OrcamentoDetalhe, OrcamentoListaItem, OrcamentoPayload } from '../models/orcamento.model';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
// ...

@Injectable({ providedIn: 'root' })
export class OrcamentosService {
    private api = environment.apiUrl + 'Orcamentos';

    constructor(private http: HttpClient) {}

    private csrfHeaders(): HttpHeaders {
        let token = localStorage.getItem('csrf');
        if (!token) { token = crypto.randomUUID(); localStorage.setItem('csrf', token); }
        return new HttpHeaders({ 'X-CSRF-TOKEN': token });
    }

    criar(body: OrcamentoPayload) {
        return this.http.post<CriarOrcamentoResponse>(
            `${this.api}/Criar`,
            body,
            { withCredentials: true, headers: this.csrfHeaders() }
        );
    }

    gerarPDF(slug: string) {
        return this.http.get(
            `${this.api}/GerarPDF/${encodeURIComponent(slug)}`,
            { responseType: 'blob' as const , withCredentials: true }
        );
    }

    getBySlug(slug: string) {
        return this.http.get<OrcamentoDetalhe>(
            `${this.api}/Publico/${encodeURIComponent(slug)}`,
            { withCredentials: true }
        );
    }

    listMine() {
        return this.http.get<OrcamentoListaItem[]>(
            `${this.api}/Meus`,
            { withCredentials: true }
        );
    }

    calcularFrete(body: CalcularFreteRequest) {
        return this.http.post<FreteQuote>(
            `${this.api}/CalcularFrete`,
            body,
            { withCredentials: true, headers: this.csrfHeaders() }
        );
    }

    compararPrecos(payload: { categoria: string; modelo: string }) {
        return this.http.post<{
            newPriceAvg: number | null;
            usedPriceAvg: number | null;
            priceMin: number | null;
            priceMax: number | null;
            newSites: { site: string; valor: number; qtd: number }[];
            usedSites: { site: string; valor: number; qtd: number }[];
            newPriceSources: string[];
            usedPriceSources: string[];
        }>(`${this.api}/CompararPrecos`, payload);
    }
}
