export type Condicao = 'impecavel' | 'bom' | 'regular';
export type Urgencia  = 'normal'    | 'rapida' | 'imediata';

export type OrcamentoPayload = {
    usuarioId?: number | null;
    categoria: string;
    modelo: string;
    anosUso: number;
    condicao: string;
    urgencia: string;
    temCaixaManual: boolean;
    temNotaFiscal: boolean;
    observacoes?: string | null;
    mediaNovo?: number | null;
    mediaUsado?: number | null;
    precoMin?: number | null;
    precoMax?: number | null;
    precoEscolhido?: number | null;
    fotos: string[];

    nomeCompleto?: string | null;
    incluirTransporte?: boolean;
    valorTransporteManual?: number | null;
    valorTransporteCalculado?: number | null;
};
export interface CriarOrcamentoResponse {
    id: number;
    slug: string;
    publicUrl: string;
}

export interface OrcamentoDetalhe {
    id: number;
    slug: string;

    categoria: string;
    modelo: string;
    anosUso: number;
    condicao: Condicao;
    urgencia: Urgencia;
    temCaixaManual: boolean;
    temNotaFiscal: boolean;
    observacoes?: string;

    mediaNovo?: number;
    mediaUsado?: number;
    precoMin?: number;
    precoMax?: number;
    precoEscolhido?: number;

    fotos?: string[];

    criadoEm: string;
}

export interface OrcamentoListaItem {
    id: number;
    slug: string;
    titulo: string;
    criadoEm: string;
    precoEscolhido?: number;
}

export interface FreteEndereco {
    cep: string;
    uf: string;
    cidade: string;
}

export interface FreteRequest {
    origem: FreteEndereco;
    destino: FreteEndereco;
    pesoKg: number;
    retornoVazio?: boolean;
}

export interface CorreiosServico {
    codigo: string;
    nome?: string;
    valor: number;
    prazoDias?: number | null;
    erro?: string | null;
}
export interface FreteQuote {
    valor: number;
    prazoDias?: number | null;
    servicos?: CorreiosServico[];
}

export interface CalcularFreteRequest {
    origem: FreteEndereco;
    destino: FreteEndereco;
    pesoKg: number;
    retornoVazio?: boolean;
}


export type Step9Changed = {
    incluirTransporte: boolean;
    nomeCompleto: string;
    valorManual: number | null;
    frete: { valor: number } | null;
    custoTransporte: number | null;
};