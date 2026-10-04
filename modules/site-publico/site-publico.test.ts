import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { conteudoSiteSchema, midiaPublicaPermitida } from "./validacao";

/** Cadeia do Drizzle simulada: cada `await` consome a próxima resposta de `respostas`. */
const mocks = vi.hoisted(() => {
  const m = {
    auth: vi.fn(),
    revalidate: vi.fn(),
    del: vi.fn(),
    batch: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    remover: vi.fn(),
    where: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    respostas: [] as unknown[][],
    cadeia: {} as Record<string, unknown>,
  };
  for (const nome of ["from", "orderBy", "limit", "onConflictDoUpdate"])
    m.cadeia[nome] = () => m.cadeia;
  m.cadeia.where = (...args: unknown[]) => (m.where(...args), m.cadeia);
  m.cadeia.values = (...args: unknown[]) => (m.values(...args), m.cadeia);
  m.cadeia.set = (...args: unknown[]) => (m.set(...args), m.cadeia);
  m.cadeia.then = (resolver: (valor: unknown) => unknown) => resolver(m.respostas.shift() ?? []);
  return m;
});
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@vercel/blob", () => ({ del: mocks.del }));
vi.mock("@/db", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.remover,
    batch: mocks.batch,
  },
}));

import {
  alternarPublicacaoConteudo,
  excluirConteudoSite,
  moverConteudo,
  restaurarBlocoSite,
  salvarBlocoSite,
  salvarConteudoSite,
} from "./actions";
import { blocoCatalogoPadrao, blocoFaixaPadrao, blocoInicioPadrao } from "./blocos";
import { listarConteudosPublicos, listarConteudosSite, obterBlocosSite } from "./queries";

const USUARIO = "e91c07af-683c-412c-9b4b-2f3cd70ae596";
const ID = "4f6b1c1e-5d2a-4c3b-9a7e-1f2e3d4c5b6a";
const BLOB = "https://loja.public.blob.vercel-storage.com/site-publico/foto-1.jpg";

const depoimento = {
  nota: 5,
  tipo: "depoimento",
  titulo: "Pessoa de teste",
  texto: "Relato fictício utilizado somente nos testes.",
  publicado: true,
  autorizacaoPublicacao: true,
};

const registro = {
  id: ID,
  tipo: "destaque" as const,
  titulo: "Foto",
  subtitulo: "",
  texto: "",
  tipoMidia: "imagem" as const,
  midia: BLOB,
  filtro: "original" as const,
  somOriginal: true,
  musica: "",
  volumeMusica: 60,
  ordem: 0,
  nota: null,
  publicado: false,
  autorizacaoPublicacao: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.respostas = [];
  mocks.auth.mockResolvedValue({
    user: { id: USUARIO, role: "profissional", funcao: "manager", ativo: true },
  });
  for (const fn of [mocks.select, mocks.insert, mocks.update, mocks.remover])
    fn.mockReturnValue(mocks.cadeia);
  mocks.batch.mockResolvedValue([]);
  mocks.del.mockResolvedValue(undefined);
});

describe("Publicação editorial", () => {
  it("exige nota real entre uma e cinco estrelas ao publicar um depoimento", async () => {
    for (const nota of [null, 0, 6, 3.5]) {
      expect((await salvarConteudoSite({ ...depoimento, nota })).sucesso).toBe(false);
    }
    expect(mocks.batch).not.toHaveBeenCalled();
    mocks.respostas = [[{ ultima: -1 }]];
    expect((await salvarConteudoSite({ ...depoimento, nota: 4 })).sucesso).toBe(true);
  });

  it("exige autorização para publicação e permite rascunho", async () => {
    expect(
      (await salvarConteudoSite({ ...depoimento, autorizacaoPublicacao: false })).sucesso,
    ).toBe(false);
    expect(mocks.batch).not.toHaveBeenCalled();
    mocks.respostas = [[{ ultima: -1 }]];
    expect(
      (await salvarConteudoSite({ ...depoimento, publicado: false, autorizacaoPublicacao: false }))
        .sucesso,
    ).toBe(true);
  });

  it.each([
    null,
    { user: { id: "id", role: "cliente" } },
    { user: { id: "id", role: "recepcao" } },
    { user: { id: "id", role: "profissional", funcao: "reader" } },
    { user: { id: "id", role: "profissional", ativo: false } },
  ])("impede escrita sem permissão: %j", async (sessao) => {
    mocks.auth.mockResolvedValue(sessao);
    await expect(salvarConteudoSite(depoimento)).rejects.toThrow();
    await expect(alternarPublicacaoConteudo(ID, true)).rejects.toThrow();
    await expect(moverConteudo(ID, "acima")).rejects.toThrow();
    await expect(excluirConteudoSite(ID)).rejects.toThrow();
    expect(mocks.batch).not.toHaveBeenCalled();
  });

  it("item novo entra no fim da seção, com versão e autoria registradas", async () => {
    mocks.respostas = [[{ ultima: 2 }]];
    expect((await salvarConteudoSite(depoimento)).sucesso).toBe(true);
    expect(mocks.batch.mock.calls[0][0]).toHaveLength(2);
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ ordem: 3 }));
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: USUARIO,
        dados: expect.objectContaining({ autorizacaoPublicacao: true }),
      }),
    );
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
  });

  it("ao trocar a mídia na edição, apaga o arquivo antigo que ficou sem uso", async () => {
    mocks.respostas = [[registro], [], []];
    const resultado = await salvarConteudoSite({
      ...registro,
      midia: "/images/nova.jpg",
      publicado: true,
    });
    expect(resultado.sucesso).toBe(true);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.not.objectContaining({ ordem: expect.anything() }),
    );
    expect(mocks.del).toHaveBeenCalledWith(BLOB);
  });

  it("só publica pelo atalho do card se o conteúdo estiver completo e autorizado", async () => {
    mocks.respostas = [[{ ...registro, autorizacaoPublicacao: false }]];
    const recusado = await alternarPublicacaoConteudo(ID, true);
    expect(recusado.sucesso).toBe(false);
    expect(recusado.mensagem).toContain("autorização");
    expect(mocks.batch).not.toHaveBeenCalled();

    mocks.respostas = [[registro]];
    expect((await alternarPublicacaoConteudo(ID, true)).sucesso).toBe(true);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ publicado: true }));
  });

  it("reordena trocando de lugar com o vizinho e renumerando a seção", async () => {
    const outro = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
    mocks.respostas = [[registro], [{ id: outro }, { id: ID }]];
    await moverConteudo(ID, "acima");
    expect(mocks.set.mock.calls.map(([valor]) => valor.ordem)).toEqual([0, 1]);
    expect(mocks.batch.mock.calls[0][0]).toHaveLength(2);
  });

  it("exclui o conteúdo e o arquivo enviado, mas nunca as fotos fixas do site", async () => {
    const musica = "https://loja.public.blob.vercel-storage.com/site-publico/musica-1.mp3";
    mocks.respostas = [[{ ...registro, musica }], [], []];
    expect((await excluirConteudoSite(ID)).sucesso).toBe(true);
    expect(mocks.remover).toHaveBeenCalled();
    expect(mocks.del).toHaveBeenCalledWith(BLOB);
    expect(mocks.del).toHaveBeenCalledWith(musica);

    mocks.del.mockClear();
    mocks.respostas = [[{ ...registro, midia: "/profissionais_modelos/prof_1.png" }]];
    await excluirConteudoSite(ID);
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("consulta pública filtra autorização e publicação e não retorna auditoria ou dados clínicos", async () => {
    await listarConteudosPublicos();
    expect(mocks.auth).not.toHaveBeenCalled();
    const sql = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
    expect(sql.sql).toContain('"conteudo_site"."publicado"');
    expect(sql.sql).toContain('"conteudo_site"."autorizacao_publicacao"');
    expect(sql.params).toEqual([true, true]);
    expect(Object.keys(mocks.select.mock.calls[0][0]).sort()).toEqual(
      [
        "id",
        "nota",
        "midia",
        "ordem",
        "subtitulo",
        "texto",
        "tipo",
        "tipoMidia",
        "titulo",
        "filtro",
        "somOriginal",
        "musica",
        "volumeMusica",
      ].sort(),
    );
  });

  it("protege a listagem de rascunhos", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "id", role: "cliente" } });
    await expect(listarConteudosSite()).rejects.toThrow();
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("aceita só mídia editorial pública, sem rotas clínicas, SVG ou URLs arbitrárias", () => {
    for (const url of [
      "/api/fotos/123/imagem",
      "https://loja.public.blob.vercel-storage.com/clientes/foto.jpg",
      "https://exemplo.com/foto.jpg",
      "javascript:alert(1)",
      "/images/foto.svg",
      "//example.com/a.jpg",
    ])
      expect(midiaPublicaPermitida(url)).toBe(false);
    expect(midiaPublicaPermitida("/images/foto.jpg")).toBe(true);
    expect(midiaPublicaPermitida(BLOB)).toBe(true);
    expect(conteudoSiteSchema.safeParse({ ...depoimento, tipo: "destaque" }).success).toBe(false);
    expect(conteudoSiteSchema.safeParse({ ...depoimento, texto: "" }).success).toBe(false);
    // Música só do Blob da tela; e o campo de foto/vídeo não aceita áudio.
    expect(
      conteudoSiteSchema.safeParse({ ...depoimento, musica: "https://exemplo.com/a.mp3" }).success,
    ).toBe(false);
    expect(
      conteudoSiteSchema.safeParse({
        ...depoimento,
        musica: "https://loja.public.blob.vercel-storage.com/site-publico/musica.mp3",
      }).success,
    ).toBe(true);
    expect(
      midiaPublicaPermitida("https://loja.public.blob.vercel-storage.com/site-publico/musica.mp3"),
    ).toBe(false);
  });
});

describe("Textos editáveis do site", () => {
  it("mescla os blocos salvos com o padrão e ignora registro inválido, sem exigir login", async () => {
    mocks.respostas = [
      [
        { chave: "faixa", valor: { palavras: ["Cuidado"] } },
        { chave: "inicio", valor: { selo: "" } },
        { chave: "desconhecido", valor: {} },
      ],
    ];
    const { blocos, personalizados } = await obterBlocosSite();
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(blocos.faixa.palavras).toEqual(["Cuidado"]);
    expect(blocos.inicio).toEqual(blocoInicioPadrao);
    expect(blocos.catalogo).toEqual(blocoCatalogoPadrao);
    expect(personalizados).toEqual(["faixa"]);
  });

  it("valida, grava com histórico e diz onde está o erro", async () => {
    const invalido = await salvarBlocoSite("catalogo", {
      ...blocoCatalogoPadrao,
      categorias: blocoCatalogoPadrao.categorias.map((categoria, indice) =>
        indice === 2 ? { ...categoria, nome: "" } : categoria,
      ),
    });
    expect(invalido).toEqual({
      sucesso: false,
      mensagem: "Categoria 3 › Nome: Preencha este campo.",
    });
    expect(mocks.batch).not.toHaveBeenCalled();

    mocks.respostas = [[]];
    expect((await salvarBlocoSite("faixa", { palavras: ["Cuidado", "Carinho"] })).sucesso).toBe(
      true,
    );
    expect(mocks.batch.mock.calls[0][0]).toHaveLength(2);
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ chave: "faixa", usuarioId: USUARIO }),
    );
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
  });

  it("apaga a arte do catálogo que foi trocada e não é usada em outro lugar", async () => {
    const antiga = "https://loja.public.blob.vercel-storage.com/site-publico/arte-1.jpg";
    const catalogoAntigo = {
      ...blocoCatalogoPadrao,
      categorias: [
        { ...blocoCatalogoPadrao.categorias[0], paginas: [{ titulo: "Arte", imagem: antiga }] },
      ],
    };
    mocks.respostas = [[{ valor: catalogoAntigo }], [], []];
    await salvarBlocoSite("catalogo", {
      ...catalogoAntigo,
      categorias: [{ ...catalogoAntigo.categorias[0], paginas: [] }],
    });
    expect(mocks.del).toHaveBeenCalledWith(antiga);
  });

  it("restaura o padrão removendo o registro, e protege escrita e chaves desconhecidas", async () => {
    mocks.respostas = [[{ valor: blocoFaixaPadrao }]];
    expect((await restaurarBlocoSite("faixa")).sucesso).toBe(true);
    expect(mocks.remover).toHaveBeenCalled();

    expect((await salvarBlocoSite("inexistente" as "faixa", {})).sucesso).toBe(false);
    mocks.auth.mockResolvedValue({ user: { id: "id", role: "profissional", funcao: "reader" } });
    await expect(salvarBlocoSite("faixa", blocoFaixaPadrao)).rejects.toThrow();
    await expect(restaurarBlocoSite("faixa")).rejects.toThrow();
  });
});
