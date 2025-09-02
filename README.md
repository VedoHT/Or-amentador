VÍDEO DO FUNCIONAMENTO DO PROJETO:
https://youtu.be/TTtRffUPshQ


Projeto full-stack para criação de orçamentos de peças de computador com wizard em 10 etapas, comparação de preços (novos x usados) e geração de PDF.

✨ Funcionalidades

Wizard de 10 etapas com validações progressivas

Upload de fotos (até 5)

Cálculo de frete (serviço IFreteServiceInterface)

Comparador de preços (Etapa 6)

Novos: média por loja (Amazon, Terabyte, KaBuM!, Pichau, Mercado Livre, Magazine Luiza) via Google Shopping (SerpApi)

Usados: Mercado Livre (API) + OLX (via Google orgânico/SerpApi) + (opcional) eBay

Sugestão de faixa de preço e ajuste manual

Geração de PDF do orçamento

Rotas públicas/privadas (JWT pronto para vincular usuário quando autenticado)

🧱 Stack

Frontend: Angular standalone (Forms/ReactiveForms, animações), ngx-mask

Backend: ASP.NET Core (C#), Controllers clássicos, IHttpClientFactory

PDF: GeradorPdfOrcamentoModulo

Comparador: ComparadorService (fan-out multi-fonte + agregação)

🧭 Navegação do Wizard (resumo)

Introdução

Categoria + Modelo

Anos de uso + Condição

Urgência + Caixa / Nota fiscal

Observações

Comparador de preços (dispara backend)

Médias e faixa sugerida + ajuste manual

Fotos (até 5)

Custos adicionais (nome, transporte, frete/manual)

Revisão e Gerar orçamento

🏗️ Arquitetura & Pastas (resumo)
/api
  Orcei.Controllers.Orcamentos/OrcamentosController.cs
  Orcei.ServicosConexao.Services/ComparadorService.cs
  Orcei.Interfaces.Services/IFreteServiceInterface.cs
  Orcei.Modulos.Orcamento/* (módulos de negócio, PDF, etc.)
  Orcei.Models/* (DTOs e respostas)

/web (Angular)
  src/app/pages/orcamentos/wizard/ (wizard)
  src/app/components/photo-uploader/ (upload de fotos)
  src/app/services/orcamentos.service.ts


Os nomes exatos podem variar conforme sua solução; acima é um guia para localização.

🔌 Endpoints principais
POST /Orcamentos/Criar

Cria um orçamento (anônimo ou autenticado via JWT).
Body: OrcamentoPayload (modelo, fotos, valores etc.)
Resposta: CriarOrcamentoResponse (inclui slug).

GET /Orcamentos/GerarPDF/{slug}

Retorna o PDF do orçamento (application/pdf).

POST /Orcamentos/CalcularFrete

Calcula frete via IFreteServiceInterface.

GET /Orcamentos/Publico/{slug}

Retorna dados públicos do orçamento.

GET /Orcamentos/Meus



🔎 Como funciona o Comparador (Etapa 6)

Fan-out em paralelo:

Novos: Google Shopping (SerpApi), whitelist fixa:
Amazon, Terabyte, KaBuM!, Pichau, Mercado Livre, Magazine Luiza.
Normaliza source/host → agrupa por loja → remove outliers → média por loja.

Usados:

Mercado Livre (API pública; filtra condition == "used").

OLX via Google orgânico (SerpApi site:olx.com.br + extração de “R$ …” do snippet/rich snippet).

eBay (opcional, com câmbio para BRL).

Faixa sugerida:

Se houver usados: min = 85%, max = 120% da média de usados.

Senão, usa novos: min = 60%, max = 80% do novo.

Resiliência:

Timeouts por fonte, tratamento de 403 no ML (User-Agent + token opcional).

Outliers cortados com mediana (filtro simples 50%—200% da mediana).

Resultados cacheáveis por termo (TTL sugerido: 12–24h).

Observação OLX: se o Google não expuser preço no snippet, o valor pode ficar ausente. Nesses casos, o projeto exibe apenas as fontes disponíveis (ML/eBay).

Lista orçamentos do usuário autenticado (JWT).

POST /Orcamentos/CompararPrecos

Dispara o comparador (Etapa 6).
