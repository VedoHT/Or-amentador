import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrcamentosService } from 'src/app/services/orcamentos.service';
import { ToastService } from 'src/app/services/toast.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

type DetalheView = any & {
  fotos?: string[];
  fontesNovo?: string[];
  fontesUsado?: string[];
  createdAt?: string | null;
  criadoEm?: string | null;
  anosUso?: number;
  condicao?: string;
  urgencia?: string;
  temCaixaManual?: boolean;
  temNotaFiscal?: boolean;
  observacoes?: string | null;
  categoria?: string;
  modelo?: string;
  precoMin?: number;
  precoMax?: number;
  precoEscolhido?: number;
  mediaNovo?: number;
  mediaUsado?: number;
  slug?: string;
};

@Component({
  standalone: true,
  selector: 'app-result',
  imports: [CommonModule, RouterLink],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  slug = '';
  link = '';
  data?: DetalheView;
  loading = true;

  // público vs interno
  isPublic = false;

  // Lightbox
  viewerOpen = false;
  viewerIndex = 0;
  closing = false;

  constructor(
      private route: ActivatedRoute,
      private orcamentos: OrcamentosService,
      private toast: ToastService,
      private sanitizer: DomSanitizer
  ) {
    const slugParam = this.route.snapshot.paramMap.get('slug') || '';
    this.link = `${window.location.origin}/orcamento/${slugParam}`;
    // define modo público pela rota
    this.isPublic = this.route.snapshot.data['public'] === true
        || this.route.snapshot.routeConfig?.path?.startsWith('o/')
        || this.route.snapshot.routeConfig?.path?.startsWith('orcamento/')
        || false;
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.slug) { this.loading = false; return; }

    this.orcamentos.getBySlug(this.slug).subscribe({
      next: (q) => {
        const fotos = Array.isArray((q as any)?.fotos) ? (q as any).fotos
            : Array.isArray((q as any)?.Fotos) ? (q as any).Fotos
                : [];

        const num = (v: any) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };

        // transporte (manual vence calculado)
        const nomeCompleto = (q as any)?.nomeCompleto ?? null;
        const incluirTransporte = !!(
            (q as any)?.incluirTransporte ??
            (q as any)?.transporteHabilitado ??
            (q as any)?.usarTransporte ??
            false
        );
        const valorManual = num((q as any)?.valorTransporteManual);
        const valorCalc   = num((q as any)?.valorTransporteCalculado ?? (q as any)?.frete?.valor);
        const valorTransporte = (valorManual && valorManual > 0) ? valorManual : (valorCalc ?? null);

        const precoEscolhido = num((q as any)?.precoEscolhido);
        const total = (precoEscolhido != null)
            ? precoEscolhido + (incluirTransporte ? (valorTransporte ?? 0) : 0)
            : null;

        this.data = {
          ...q,
          fotos,
          fontesNovo: (q as any)?.fontesNovo ?? [],
          fontesUsado: (q as any)?.fontesUsado ?? [],
          createdAt: (q as any)?.createdAt ?? (q as any)?.criadoEm ?? null,

          // novos/derivados usados no template
          nomeCompleto,
          incluirTransporte,
          valorTransporte,
          total
        };

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  /* ===== Helpers de rótulo/estilo ===== */
  labelCondicao(c?: string) {
    switch ((c || '').toLowerCase()) {
      case 'impecavel': return 'Impecável';
      case 'bom': return 'Bom';
      default: return 'Regular';
    }
  }
  condClass(c?: string) {
    const v = (c || '').toLowerCase();
    return { ok: v === 'impecavel', warn: v === 'bom', bad: v === 'regular' };
  }
  labelUrgencia(u?: string) {
    switch ((u || '').toLowerCase()) {
      case 'imediata': return 'Imediata';
      case 'rapida': return 'Rápida';
      default: return 'Normal';
    }
  }
  urgClass(u?: string) {
    const v = (u || '').toLowerCase();
    return { bad: v === 'imediata', warn: v === 'rapida', ok: v === 'normal' };
  }

  /* ===== Fontes ===== */
  isUrl(s?: string): boolean {
    if (!s) return false;
    try { new URL(s); return true; } catch { return false; }
  }
  host(s: string): string {
    try { return new URL(s).hostname.replace(/^www\./, ''); } catch { return s; }
  }

  /* ===== Link público (somente interno) ===== */
  copy(): void {
    navigator.clipboard.writeText(this.link).then(
        () => this.toast.success('Link copiado!'),
        () => this.toast.warn('Não foi possível copiar o link.')
    );
  }

  /* ===== Fotos / Lightbox ===== */
  safeFoto(f: string): SafeUrl {
    const src = f?.startsWith('data:') ? f : `data:image/jpeg;base64,${f}`;
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  get currentPhoto(): string {
    const list = this.data?.fotos ?? [];
    const cap = Math.min(list.length, 5);
    return cap ? list[this.viewerIndex % cap] : '';
  }
  openPhoto(i: number) {
    this.viewerIndex = i;
    this.closing = false;
    this.viewerOpen = true;
  }
  closeViewer() {
    if (!this.viewerOpen) return;
    this.closing = true;
    setTimeout(() => {
      this.viewerOpen = false;
      this.closing = false;
    }, 160);
  }
  next() {
    const cap = Math.min(this.data?.fotos?.length ?? 0, 5);
    if (cap) this.viewerIndex = (this.viewerIndex + 1) % cap;
  }
  prev() {
    const cap = Math.min(this.data?.fotos?.length ?? 0, 5);
    if (cap) this.viewerIndex = (this.viewerIndex - 1 + cap) % cap;
  }

  @HostListener('document:keydown.escape') onEsc() { if (this.viewerOpen) this.closeViewer(); }
  @HostListener('document:keydown.arrowRight') onRight() { if (this.viewerOpen) this.next(); }
  @HostListener('document:keydown.arrowLeft') onLeft() { if (this.viewerOpen) this.prev(); }

  trackByIndex(i: number) { return i; }

  downloadPdf(): void {
    if (!this.slug) return;
    this.orcamentos.gerarPDF(this.slug).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeSlug = (this.data?.slug || this.slug || 'orcamento');
        const nome = `${safeSlug}.pdf`;
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.warn('Falha ao gerar PDF.')
    });
  }

  transporteLabel(): string {
    if (!this.data?.incluirTransporte) return 'Não';
    const v = this.data?.valorTransporte;
    return v == null
        ? 'Incluído'
        : new Intl.NumberFormat(navigator.language, { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
  }
}
