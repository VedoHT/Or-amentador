export interface PreLoginRequest {
    email?: string;
}

export interface RetornoUsuariosGeral {
    codigoUsuario: number;
    dtaRegistro: Date;
    nomeUsuario: string;
    emailUsuario: string | null;
}

export interface RetornoDadoGeradoUsuarioResponse {
    dadosUsuario: RetornoUsuariosGeral;
    validade: string;
}

export interface RegistrarUsuarioRequest {
    nomeUsuario: string;
    emailUsuario: string;
}