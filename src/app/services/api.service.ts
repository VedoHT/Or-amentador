import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    protected base = environment.apiUrl;

    constructor(protected http: HttpClient) {}

    get<T>(url: string, params?: Record<string, any>) {
        let hp = new HttpParams();
        if (params) Object.keys(params).forEach(k => { if (params[k] != null) hp = hp.set(k, params[k]); });
        return this.http.get<T>(this.base + url, { params: hp, withCredentials: true });
    }

    post<T>(url: string, body?: any) {
        return this.http.post<T>(this.base + url, body, { withCredentials: true });
    }

    put<T>(url: string, body?: any) {
        return this.http.put<T>(this.base + url, body, { withCredentials: true });
    }

    delete<T>(url: string) {
        return this.http.delete<T>(this.base + url, { withCredentials: true });
    }
}
