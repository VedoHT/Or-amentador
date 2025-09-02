import { Injectable } from "@angular/core";

export interface User {
    id: number;          // 👈 número
    email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private KEY = 'wizard_auth_user';

    get currentUser(): User | null {
        const raw = localStorage.getItem(this.KEY);
        return raw ? JSON.parse(raw) as User : null;
    }

    isLoggedIn(): boolean { return !!this.currentUser; }

    // 👇 aceite o codigoUsuario numérico vindo do back
    login(identifier: string, _kind: 'otp' | 'password' = 'otp', codigoUsuario?: number) {
        if (typeof codigoUsuario !== 'number') {
            // se não veio, deixe null (login anônimo não deve salvar id)
            localStorage.setItem(this.KEY, JSON.stringify({ id: null, email: identifier }));
            return;
        }
        localStorage.setItem(this.KEY, JSON.stringify({ id: codigoUsuario, email: identifier }));
    }

    logoutLocal() { localStorage.removeItem(this.KEY); }

    getUserId(): number | null {
        const u = this.currentUser;
        return (u && typeof u.id === 'number') ? u.id : null;
    }
}
