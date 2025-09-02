import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { RegistrarUsuarioRequest } from '../../models/usuarios.model';
import { ToastService } from 'src/app/services/toast.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
    nomeUsuario = '';
    emailUsuario = '';
    sending = false;
    error = ''

    constructor(private api: LoginService, private router: Router, private toast: ToastService) {}

    private isValidEmail(e: string) {
        return /^\S+@\S+\.\S+$/.test(e.trim().toLowerCase());
    }

    canSubmit(): boolean {
        return !!this.nomeUsuario.trim() && this.isValidEmail(this.emailUsuario);
    }

    onSubmit() {
        if (!this.canSubmit() || this.sending) return;
        this.sending = true;
        this.error = '';

        const body: RegistrarUsuarioRequest = {
            nomeUsuario: this.nomeUsuario.trim(),
            emailUsuario: this.emailUsuario.trim().toLowerCase()
        };

        this.api.RegistrarUsuario(body).subscribe({
            next: () => {
                this.toast.show( 'success', 'Usuário registrado com sucesso!');
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.error = err?.error?.mensagem || 'Falha ao registrar. Tente novamente.';
                this.sending = false;
            }
        });

    }
}
