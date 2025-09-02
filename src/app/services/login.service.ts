import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    PreLoginRequest,
    RetornoDadoGeradoUsuarioResponse,
    RetornoUsuariosGeral
} from '../models/usuarios.model';

@Injectable({ providedIn: 'root' })
export class LoginService {
    private api = environment.apiUrl + 'Login';

    constructor(private http: HttpClient) {}

    PreLogin(dados: PreLoginRequest): Observable<RetornoDadoGeradoUsuarioResponse> {
        return this.http.post<RetornoDadoGeradoUsuarioResponse>(`${this.api}/PreLogin`, dados, { withCredentials: true });
    }

    RegistrarUsuario(RegistrarUsuarioRequest: any): Observable<boolean> {
        return this.http.post<boolean>(`${this.api}/RegistrarUsuario`, RegistrarUsuarioRequest, { withCredentials: true });
    }

    Login(dados: RetornoUsuariosGeral, codigo: string, keepMeConnected: boolean): Observable<boolean> {
        return this.http.post<boolean>(`${this.api}/Login/${codigo}`, { ...dados, keepMeConnected }, { withCredentials: true });
    }

    Logout(): Observable<{ status: boolean; mensagem: string }> {
        return this.http.post<{ status: boolean; mensagem: string }>(`${this.api}/Logout`, {}, { withCredentials: true });
    }

    /** Opcional: renova JWT silenciosamente usando refreshToken cookie.
     *  Ajuste environment.refreshPath se seu backend já possuir esse endpoint.
     */
    Refresh(): Observable<any> {
        if (!environment.refreshPath) return of(null);
        return this.http.post<any>(`${environment.apiUrl}${environment.refreshPath}`, {}, { withCredentials: true });
    }
}
