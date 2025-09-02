import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpBackend } from '@angular/common/http';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { OrcamentosService } from 'src/app/services/orcamentos.service';
import { NgxMaskDirective } from 'ngx-mask';

type FreteBasic = { valor: number } | null;

@Component({
    standalone: true,
    selector: 'app-step9-custos-adicionais',
    imports: [CommonModule, ReactiveFormsModule, HttpClientModule, NgxMaskDirective],
    templateUrl: './passo9-custos-adicionais.component.html',
    styleUrls: ['./passo9-custos-adicionais.component.css']
})
export class Step9CustosAdicionaisComponent implements OnInit, OnChanges {
    /* ====== Estado vindo do pai (wizard) ====== */
    @Input() nomeCompleto = '';
    @Input() incluirTransporte = false;
    @Input() valorManual: number | null = null;
    @Input() frete: FreteBasic = null; // só carregamos {valor}

    @Output() changed = new EventEmitter<{
        incluirTransporte: boolean;
        nomeCompleto: string;
        valorManual: number | null;
        frete: FreteBasic;
        custoTransporte: number | null;
    }>();

    constructor(
        private fb: FormBuilder,
        httpBackend: HttpBackend,
        private orcSvc: OrcamentosService
    ) { this.httpRaw = new HttpClient(httpBackend); }

    private httpRaw: HttpClient;

    readonly MAX_PESO = 30; // limite para cálculo automático
    readonly DEFAULT_PKG = { height: 5, width: 15, length: 20 }; // placeholders & fallback

    freteFonte = 'SuperFrete (PAC/SEDEX)';

    /* ====== Forms ====== */
    form: FormGroup = this.fb.group({
        nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
        incluirTransporte: [false],
    });

    transporteForm: FormGroup = this.fb.group({
        // ORIGEM
        origemCep: ['', [Validators.required, Validators.minLength(8)]],
        origemUf: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
        origemCidade: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
        // DESTINO
        destinoCep: ['', [Validators.required, Validators.minLength(8)]],
        destinoUf: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
        destinoCidade: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
        // CAMPOS DE CÁLCULO
        pesoKg: [null as number | null, [Validators.required, Validators.min(0.3)]],
        // DIMENSÕES (opcionais) — se vazias, uso DEFAULT_PKG; se presentes, validar limites + soma
        alturaCm: [null as number | null, [Validators.min(1), Validators.max(150)]],
        larguraCm: [null as number | null, [Validators.min(1), Validators.max(150)]],
        comprimentoCm: [null as number | null, [Validators.min(1), Validators.max(150)]],
        // VALOR MANUAL (fora da modal)
        valorManual: [null as number | null]
    }, { validators: [dimsSumValidator(200)] }); // soma C+L+A <= 200

    // estado UI
    modalOpen = false;
    loading = false;

    // status CEP
    buscandoOrigem = false; buscandoDestino = false;
    cepOrigemErro = ''; cepDestinoErro = '';
    apiError = '';

    // hints de "?"
    hint = { altura: false, largura: false, comprimento: false };

    /* ====== Lifecycle ====== */
    ngOnInit(): void {
        // CEP watchers
        this.watchCep('origemCep', 'origemUf', 'origemCidade', b => this.buscandoOrigem = b, e => this.cepOrigemErro = e);
        this.watchCep('destinoCep', 'destinoUf', 'destinoCidade', b => this.buscandoDestino = b, e => this.cepDestinoErro = e);

        // valueChanges → emitir
        this.transporteForm.controls['valorManual'].valueChanges!
            .pipe(debounceTime(150))
            .subscribe(() => this.emit());

        this.form.controls['nomeCompleto'].valueChanges!
            .pipe(debounceTime(150))
            .subscribe(() => this.emit());

        this.form.controls['incluirTransporte'].valueChanges!
            .pipe(debounceTime(50))
            .subscribe(() => this.emit());
    }

    ngOnChanges(_: SimpleChanges): void {
        // Re-hidrata o form quando o usuário volta da etapa 10 para a 9
        this.form.patchValue({
            nomeCompleto: this.nomeCompleto ?? '',
            incluirTransporte: !!this.incluirTransporte,
        }, { emitEvent: false });

        this.transporteForm.patchValue({
            valorManual: this.valorManual ?? null
        }, { emitEvent: false });

        // Atualiza frete local (apenas {valor})
        this.frete = this.frete && typeof this.frete.valor === 'number'
            ? { valor: this.frete.valor }
            : null;
    }

    /* ======= Helpers de validação ======= */
    get dimsSumExceeded(): boolean {
        return !!this.transporteForm.errors?.['dimsSumExceeded'];
    }

    toggleHint(k: 'altura' | 'largura' | 'comprimento') {
        this.hint[k] = !this.hint[k];
    }

    // CEP → ViaCEP
    private watchCep(
        ctrlCep: 'origemCep' | 'destinoCep', ctrlUf: 'origemUf' | 'destinoUf', ctrlCidade: 'origemCidade' | 'destinoCidade',
        setBusy: (b: boolean) => void, setErr: (m: string) => void
    ) {
        const cepCtrl = this.transporteForm.controls[ctrlCep] as AbstractControl;
        cepCtrl.valueChanges!.pipe(
            map((v: any) => (v || '').toString().replace(/\D/g, '')),
            tap(v => { if (v !== cepCtrl.value) cepCtrl.setValue(v, { emitEvent: false }); }),
            debounceTime(250),
            distinctUntilChanged(),
            tap(() => setErr('')),
            filter(v => v.length >= 8),
            tap(() => setBusy(true)),
            switchMap(cep => this.httpRaw.get<any>(`https://viacep.com.br/ws/${cep}/json/`, { withCredentials: false }).pipe(
                catchError(() => of(null)),
                tap(() => setBusy(false))
            ))
        ).subscribe(resp => {
            if (!resp || resp.erro) {
                this.transporteForm.patchValue({ [ctrlUf]: '', [ctrlCidade]: '' } as any, { emitEvent: false });
                setErr('CEP não encontrado');
                return;
            }
            this.transporteForm.patchValue(
                { [ctrlUf]: (resp.uf || '').toUpperCase(), [ctrlCidade]: resp.localidade || '' } as any,
                { emitEvent: false }
            );
            setErr('');
        });
    }

    /* ======= UI principal ======= */
    onToggleTransporte() { this.emit(); }

    openModal() { this.modalOpen = true; this.apiError = ''; }
    closeModal() { this.modalOpen = false; }

    // peso > 30 bloqueia cálculo
    get pesoAcimaLimite(): boolean {
        const v = Number(this.transporteForm.controls['pesoKg'].value ?? 0);
        return v > this.MAX_PESO;
    }

    onPesoInput() {
        const ctrl = this.transporteForm.controls['pesoKg'];
        const v = Number(ctrl.value ?? 0);
        const errs = { ...(ctrl.errors || {}) };
        if (v > this.MAX_PESO) errs['limite'] = true; else delete errs['limite'];
        ctrl.setErrors(Object.keys(errs).length ? errs : null);
    }

    calcularFrete() {
        this.apiError = '';

        if (this.pesoAcimaLimite) {
            this.apiError = `Peso acima do limite de ${this.MAX_PESO} kg para cálculo automático. Informe o valor manualmente.`;
            return;
        }
        if (this.dimsSumExceeded) {
            this.apiError = 'A soma (Comprimento + Largura + Altura) não pode exceder 200 cm.';
            return;
        }
        if (this.transporteForm.invalid) return;

        this.loading = true;
        const raw = this.transporteForm.getRawValue();

        // fallback de dimensões aos padrões se usuário não preencher
        const height = this.numOrDefault(raw.alturaCm, this.DEFAULT_PKG.height);
        const width  = this.numOrDefault(raw.larguraCm, this.DEFAULT_PKG.width);
        const length = this.numOrDefault(raw.comprimentoCm, this.DEFAULT_PKG.length);

        const body: any = {
            origem: { cep: (raw.origemCep || '').trim(), uf: (raw.origemUf || '').toString().toUpperCase(), cidade: raw.origemCidade || '' },
            destino:{ cep: (raw.destinoCep|| '').trim(), uf: (raw.destinoUf|| '').toString().toUpperCase(), cidade: raw.destinoCidade|| '' },
            pesoKg: this.pesoAcimaLimite ? undefined : Number(raw.pesoKg),
            retornoVazio: false,
            package: { height, width, length }
        };

        this.orcSvc.calcularFrete(body).subscribe({
            next: (q: any) => {
                // guardamos apenas o valor (sem distância)
                const valor = Number(q?.valor ?? 0);
                this.frete = isNaN(valor) ? null : { valor };
                this.loading = false;
                this.emit();
            },
            error: (err) => {
                this.frete = null;
                this.apiError = err?.error?.mensagem || 'Falha ao calcular frete.';
                this.loading = false;
                this.emit();
            }
        });
    }

    aplicarFrete() {
        if (!this.frete) return;
        this.modalOpen = false;
        this.emit();
    }

    limparFreteForm() {
        this.apiError = '';
        this.frete = null;
        this.buscandoOrigem = this.buscandoDestino = false;
        this.cepOrigemErro = this.cepDestinoErro = '';

        this.transporteForm.reset({
            origemCep: '',
            origemUf: '',
            origemCidade: '',
            destinoCep: '',
            destinoUf: '',
            destinoCidade: '',
            pesoKg: null,
            alturaCm: null,
            larguraCm: null,
            comprimentoCm: null,
            valorManual: this.transporteForm.controls['valorManual'].value
        }, { emitEvent: false });

        // limpa erros
        ['pesoKg','alturaCm','larguraCm','comprimentoCm'].forEach(k => {
            const c = this.transporteForm.controls[k];
            c.setErrors(null);
            c.markAsPristine();
            c.markAsUntouched();
        });

        this.emit();
    }

    /* ======= Helpers ======= */
    get valorManualFromForm(): number | null {
        const v = this.transporteForm.value['valorManual'] as any;
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
    }

    private numOrDefault(v: any, d: number): number {
        const n = Number(v);
        return isNaN(n) || n <= 0 ? d : n;
    }

    private custoSelecionado(): number | null {
        if (this.form.value.incluirTransporte !== true) return null;
        return (this.valorManualFromForm && this.valorManualFromForm > 0)
            ? this.valorManualFromForm
            : (this.frete?.valor ?? null);
    }

    emit() {
        this.changed.emit({
            nomeCompleto: (this.form.value.nomeCompleto || '').trim(),
            incluirTransporte: this.form.value.incluirTransporte === true,
            valorManual: this.valorManualFromForm,
            frete: this.frete,
            custoTransporte: this.custoSelecionado()
        });
    }
}

/** Validator de grupo: soma (C + L + A) <= maxSum.
 *  Só valida quando os 3 valores estão presentes e > 0 (se algum estiver vazio, não acusa erro).
 */
function dimsSumValidator(maxSum: number) {
    return (ac: AbstractControl) => {
        const g = ac as FormGroup;
        const h = Number(g.get('alturaCm')?.value ?? 0);
        const w = Number(g.get('larguraCm')?.value ?? 0);
        const l = Number(g.get('comprimentoCm')?.value ?? 0);

        if (!(h > 0 && w > 0 && l > 0)) return null; // se não informou todos, não bloqueia
        return (h + w + l) > maxSum ? { dimsSumExceeded: true } : null;
    };
}
