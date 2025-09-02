import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { LoginService } from '../../services/login.service';
import {
    PreLoginRequest,
    RetornoDadoGeradoUsuarioResponse,
    RetornoUsuariosGeral
} from '../../models/usuarios.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, NgxMaskDirective, NgxMaskPipe],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnDestroy {
    keepMeConnected = false;
    email = '';
    codigoGerado = '';
    enviouCodigo = false;
    enviarDesabilitado = false;
    erroLogin = false;
    usaEmail = true;
    tempoRestante = 0;
    private timer: any;
    private dadosUsuario?: RetornoUsuariosGeral;

    constructor(
        private api: LoginService,
        private router: Router,
        private route: ActivatedRoute,
        private auth: AuthService,
        private cdr: ChangeDetectorRef,
        private toast: ToastService
    ) {}

    ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

    onSubmit(): void {
        if (!this.enviouCodigo) {
            this.GerarCodigo();
        } else {
            this.LoginUsuario();
        }
    }

    reSend(): void {
        if (this.tempoRestante === 0) {
            this.enviarDesabilitado = false;
            this.enviouCodigo = false; // permite GerarCodigo() rodar de novo
            this.cdr.markForCheck();
            this.GerarCodigo();
        }
    }

    GerarCodigo(): void {
        const body: PreLoginRequest = { email: this.email.trim().toLowerCase() };
        if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) { this.erroLogin = true; this.cdr.markForCheck(); return; }

        if (!this.enviarDesabilitado && !this.enviouCodigo) {
            this.enviarDesabilitado = true;
            this.cdr.markForCheck(); // opcional: já reflete o disabled
            this.api.PreLogin(body).subscribe({
                next: (resp) => {
                    this.enviouCodigo = true;
                    this.erroLogin = false;
                    this.dadosUsuario = resp.dadosUsuario;

                    const validade = new Date(resp.validade).getTime();
                    const now = Date.now();
                    this.tempoRestante = Math.max(0, Math.floor((validade - now) / 1000));
                    this.startTimer();

                    this.enviarDesabilitado = false;   // libera “Confirmar código”
                    this.cdr.markForCheck();           // 👈 força render imediato dos campos de código
                },
                error: () => {
                    this.erroLogin = true;
                    this.enviouCodigo = false;
                    this.enviarDesabilitado = false;
                    if (this.timer) clearInterval(this.timer);
                    this.cdr.markForCheck();           // 👈 reflete erro/estado
                }
            });
        }
    }

    private startTimer(): void {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.tempoRestante > 0) {
                this.tempoRestante--;
                this.cdr.markForCheck(); // OnPush: atualiza o contador no DOM
            } else {
                clearInterval(this.timer);
                this.timer = null;
                // 👇 expiração: volta ao estado natural e avisa
                this.toast.warn('Código expirou! Tente novamente realizar o login.');
                this.resetForm();        // volta para campo de e-mail + "Enviar código"
                this.cdr.markForCheck();
            }
        }, 1000);
    }

    resetForm(): void {
        this.erroLogin = false;
        this.enviouCodigo = false;
        this.enviarDesabilitado = false;
        this.codigoGerado = '';
        this.tempoRestante = 0;
        if (this.timer) clearInterval(this.timer);
        this.cdr.markForCheck();                 // 👈 reflete o reset imediatamente
    }

    verificarCodigo(): void {
        this.enviarDesabilitado = !(this.codigoGerado?.toString().length === 6);
    }

    LoginUsuario(): void {
        if (!this.enviarDesabilitado && this.enviouCodigo && this.dadosUsuario) {
            const du = this.dadosUsuario;
            const email = (du.emailUsuario ?? '').trim().toLowerCase();
            const identifier = email;

            this.api.Login(du, this.codigoGerado, this.keepMeConnected).subscribe({
                next: (ok) => {
                    if (ok) {
                        if (this.timer) clearInterval(this.timer);
                        this.erroLogin = false;
                        const email = (du.emailUsuario ?? '').trim().toLowerCase();
                        this.auth.login(identifier, 'otp', du.codigoUsuario);

                        this.toast.show('success', 'Login realizado com sucesso!'); // 👈 aqui

                        const redirect = this.route.snapshot.queryParamMap.get('redirect');
                        this.router.navigateByUrl(redirect || '/meus');
                    } else {
                        this.erroLogin = true;
                    }
                },
                error: () => { this.erroLogin = true; }
            });
        }
    }

    formatTime(s: number): string {
        const m = Math.floor(s / 60), r = s % 60;
        return `${m.toString().padStart(2,'0')}:${r.toString().padStart(2,'0')}`;
    }
}
