import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PhotoUploaderComponent } from '../../components/photo-uploader/photo-uploader.component';
import { QuoteInput } from '../../models';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from 'src/app/services/auth.service';
import { OrcamentoPayload, Step9Changed } from 'src/app/models/orcamento.model';
import { OrcamentosService } from 'src/app/services/orcamentos.service';
import { NgxMaskDirective } from 'ngx-mask';
import { Step9CustosAdicionaisComponent } from './passo9-custos-adicionais/passo9-custos-adicionais.component';

@Component({
  standalone: true,
  selector: 'app-wizard',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    PhotoUploaderComponent, NgxMaskDirective, Step9CustosAdicionaisComponent,
  ],
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.css'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})


export class WizardComponent implements OnInit {

  readonly MAX_PRICE = 1_000_000_000;

  manualPriceCtrl = new FormControl<number | null>(null);

  // === Estado Etapa 9 (custos adicionais) ===
  step9_nomeCompleto: string = '';
  step9_incluirTransporte = false;

  step9_custoTransporte?: number;
  step9_frete: { valor: number } | null = null;
  step9_valorManual: number | null = null;

  get chosenPrice(): number { return Number(this.model.chosenPrice ?? 0); }
  set chosenPrice(v: any) {
    const n = Math.max(0, Math.min(this.MAX_PRICE, Number(v) || 0));
    if (this.model.chosenPrice !== n) {
      this.model.chosenPrice = Math.round(n);
      this.manualPriceCtrl?.setValue(this.model.chosenPrice, { emitEvent: false });
    }
  }
  get sliderMax(): number {
    const sugMax = this.model.priceMax ?? this.MAX_PRICE;
    return Math.min(sugMax, this.MAX_PRICE);
  }
  get chosenPercent(): number {
    const min = this.model.priceMin ?? 0;
    const max = this.sliderMax;
    const val = this.chosenPrice;
    if (max <= min) return 0;
    return Math.max(0, Math.min(100, Math.round(((val - min) * 100) / (max - min))));
  }

  get canNext(): boolean {
    switch (this.step) {
      case 1: return true;
      case 2: return !!(this.model.category && this.model.model);
      case 3: return this.model.yearsUsed >= 0 && !!this.model.condition;
      case 4: return true;
      case 5: return true;
      case 6: return this.comparisonDone;
      case 7: return this.model.chosenPrice != null;
      case 8: return true;
      case 9: {
        const nomeOk = (this.step9_nomeCompleto || '').trim().length >= 3;

        // valor considerado: custoTransporte -> manual -> calculado
        const v = this.step9_custoTransporte ?? this.step9_valorManual ?? this.step9_frete?.valor ?? null;

        const transpOk = !this.step9_incluirTransporte || (v != null && v > 0);
        return nomeOk && transpOk;
      }

      case 10: return true;
      default: return false;
    }
  }
  get canPrev(): boolean { return this.step > 1; }
  get isAboveMax(): boolean {
    return this.model.priceMax != null && this.chosenPrice > (this.model.priceMax as number);
  }

  model: QuoteInput = {
    category: '', model: '', yearsUsed: 0, condition: 'bom',
    urgency: 'normal', hasBox: false, hasInvoice: false,
    notes: '', photos: [],
    newPriceAvg: undefined, newPriceSources: [],
    usedPriceAvg: undefined, usedPriceSources: [],
    priceMin: undefined, priceMax: undefined, chosenPrice: undefined
  };

  comparisonDone = false;
  step = 1;
  loading = false;
  generating = false;
  loadingMessage = '';
  loadingQueue = [
    'Comparando preços com peças novas...',
    'Comparando preços com anúncios existentes...',
    'Verificando anúncios de usados...'
  ];

  constructor(
      private router: Router,
      private quotes: OrcamentosService,
      private auth: AuthService
  ) {}

  ngOnInit() {
    this.model = {
      category: '', model: '', yearsUsed: 0, condition: 'bom',
      urgency: 'normal', hasBox: false, hasInvoice: false,
      notes: '', photos: [],
      newPriceAvg: 0, usedPriceAvg: 0, priceMin: 0, priceMax: 0, chosenPrice: 0
    };
    this.step = 1;

    this.manualPriceCtrl.setValue(this.chosenPrice, { emitEvent: false });
    this.manualPriceCtrl.valueChanges.subscribe((value) => {
      const raw = Number(value ?? 0);
      const clamped = Math.max(0, Math.min(this.MAX_PRICE, isNaN(raw) ? 0 : raw));
      if (clamped !== raw) this.manualPriceCtrl.setValue(clamped, { emitEvent: false });
      this.model.chosenPrice = clamped;
    });
  }

  // Recebe os dados da etapa 9

  onStep9Changed(e: Step9Changed) {
    this.step9_incluirTransporte = !!e.incluirTransporte;
    this.step9_nomeCompleto = e.nomeCompleto ?? '';
    this.step9_valorManual = e.valorManual ?? null;
    this.step9_frete = e.frete ?? null;

    this.step9_custoTransporte = e.custoTransporte
        ?? (e.valorManual ?? e.frete?.valor ?? null)
        ?? undefined;
  }

  next() {
    if (!this.canNext) return;
    if (this.step === 6 && !this.comparisonDone) return;
    if (this.step < 10) this.step++;
  }
  prev() { if (this.canPrev) this.step--; }

  onStart() {
    if (this.loading) return;
    this.loading = true;
    this.comparisonDone = false;
    this.loadingMessage = this.loadingQueue[0];

    this.quotes.compararPrecos({
      categoria: this.model.category || '',
      modelo: (this.model.model || '').trim()
    }).subscribe({
      next: (res) => {
        this.model.newPriceAvg   = res.newPriceAvg ?? 0;
        this.model.usedPriceAvg  = res.usedPriceAvg ?? 0;
        this.model.priceMin      = res.priceMin ?? 0;
        this.model.priceMax      = res.priceMax ?? Math.max(this.model.usedPriceAvg || 0, this.model.newPriceAvg || 0);
        this.model.chosenPrice   = Math.round(((this.model.priceMin || 0) + (this.model.priceMax || 0)) / 2);

        // se quiser mostrar as linhas “Site - valor”:
        this.model.newPriceSources  = res.newSites.map(s => `${s.site} - R$ ${s.valor.toLocaleString('pt-BR')}`);
        this.model.usedPriceSources = res.usedSites.map(s => `${s.site} - R$ ${s.valor.toLocaleString('pt-BR')}`);

        this.loading = false;
        this.comparisonDone = true;
      },
      error: () => {
        this.loading = false;
        this.comparisonDone = true;
      }
    });
  }

  onGenerate() {
    const fotos = this.normalizeFotos(this.model.photos);

    const body: OrcamentoPayload = {
      usuarioId: this.auth.getUserId(),
      categoria: this.model.category,
      modelo: this.model.model,
      anosUso: this.model.yearsUsed,
      condicao: this.model.condition as any,
      urgencia: this.model.urgency as any,
      temCaixaManual: this.model.hasBox,
      temNotaFiscal: this.model.hasInvoice,
      observacoes: this.model.notes,
      mediaNovo: this.model.newPriceAvg,
      mediaUsado: this.model.usedPriceAvg,
      precoMin: this.model.priceMin,
      precoMax: this.model.priceMax,
      precoEscolhido: this.model.chosenPrice,
      nomeCompleto: this.step9_nomeCompleto || null,
      incluirTransporte: this.step9_incluirTransporte,
      valorTransporteManual: this.step9_valorManual ?? null,
      valorTransporteCalculado: (!this.step9_valorManual || this.step9_valorManual <= 0)
          ? (this.step9_frete?.valor ?? null)
          : null,
      fotos
    };

    this.generating = true;
    this.quotes.criar(body).subscribe({
      next: res => this.router.navigate(['/resultado', res.slug]),
      error: () => this.generating = false
    });
  }

  clampChosen(val: any) {
    const n = Math.max(0, Math.min(this.MAX_PRICE, Number(val) || 0));
    this.model.chosenPrice = Math.round(n);
  }
  stepPrice(delta: number) { this.chosenPrice = this.chosenPrice + delta; }

  private normalizeFotos(list?: string[]): string[] {
    if (!list?.length) return [];
    return list.map(f => f?.trim() ?? '')
        .filter(f => f.length > 0)
        .map(f => f.startsWith('data:') ? f : `data:image/jpeg;base64,${f}`);
  }
}
