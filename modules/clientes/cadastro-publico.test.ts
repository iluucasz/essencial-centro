import { beforeEach, describe, expect, it, vi } from "vitest";

/** Cadeia do Drizzle simulada: cada `await` consome a próxima resposta de `respostas`. */
const mocks = vi.hoisted(() => {
  const m = {
    auth: vi.fn(),
    enviarWhatsApp: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    respostas: [] as unknown[],
    cadeia: {} as Record<string, unknown>,
  };
  for (const nome of ["from", "where", "limit", "returning"]) m.cadeia[nome] = () => m.cadeia;
  m.cadeia.values = (...args: unknown[]) => (m.values(...args), m.cadeia);
  m.cadeia.set = (...args: unknown[]) => (m.set(...args), m.cadeia);
  m.cadeia.then = (resolver: (valor: unknown) => unknown, rejeitar: (erro: unknown) => unknown) => {
    const resposta = m.respostas.shift() ?? [];
    return resposta instanceof Error ? rejeitar(resposta) : resolver(resposta);
  };
  return m;
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("./url-publica", () => ({
  urlCadastroPublico: async (token: string) => `https://exemplo.test/cadastro/${token}`,
}));
vi.mock("@/modules/notificacoes/whatsapp", async (original) => ({
  ...(await original<typeof import("@/modules/notificacoes/whatsapp")>()),
  enviarWhatsAppTexto: mocks.enviarWhatsApp,
}));
vi.mock("@/db", () => ({
  db: { select: mocks.select, insert: mocks.insert, update: mocks.update },
}));

import { concluirCadastroPublico, enviarCadastroPorWhatsApp } from "./cadastro-publico-actions";
import {
  conviteExpirado,
  expiracaoConvite,
  gerarTokenConvite,
  mensagemConviteWhatsApp,
} from "./convite";
import { lerFormularioCliente } from "./formulario";
import { cadastroPublicoClienteSchema } from "./schema";

const USUARIO = "e91c07af-683c-412c-9b4b-2f3cd70ae596";
const CRIADOR_CONVITE = "4f6b1c1e-5d2a-4c3b-9a7e-1f2e3d4c5b6a";
const TOKEN = "token-de-teste-com-tamanho-suficiente";

function convite(extra: Record<string, unknown> = {}) {
  return {
    id: "c0a80101-0000-4000-8000-000000000001",
    telefone: "(21) 99928-1504",
    token: TOKEN,
    tokenExpiraEm: new Date(Date.now() + 60_000),
    status: "pendente",
    clienteId: null,
    criadoPorId: CRIADOR_CONVITE,
    ...extra,
  };
}

function formularioValido(extra: Record<string, string> = {}) {
  // O formulário real envia todos os campos (vazios como ""); só os checkboxes podem faltar.
  const vazios = Object.fromEntries(
    Object.keys(lerFormularioCliente(new FormData()))
      .filter((nome) => !nome.startsWith("consentimento") && nome !== "observacoesInternas")
      .map((nome) => [nome, ""]),
  );
  const dados = new FormData();
  const campos: Record<string, string> = {
    ...vazios,
    token: TOKEN,
    nome: "maria da silva",
    dataNascimento: "1990-05-20",
    telefone: "(21) 99928-1504",
    email: "maria@example.com",
    consentimentoDados: "on",
    ...extra,
  };
  for (const [nome, valor] of Object.entries(campos)) dados.set(nome, valor);
  return dados;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.respostas = [];
  mocks.auth.mockResolvedValue({
    user: { id: USUARIO, role: "recepcao", funcao: "manager", ativo: true },
  });
  for (const fn of [mocks.select, mocks.insert, mocks.update]) fn.mockReturnValue(mocks.cadeia);
  mocks.enviarWhatsApp.mockResolvedValue({ attempted: true, sent: true });
});

describe("convite de autocadastro", () => {
  it("gera tokens únicos e longos em base64url", () => {
    const a = gerarTokenConvite();

    expect(a).not.toBe(gerarTokenConvite());
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("expira em 14 dias", () => {
    const agora = new Date("2026-10-01T00:00:00.000Z");
    const expiraEm = expiracaoConvite(agora);

    expect(conviteExpirado(expiraEm, agora)).toBe(false);
    expect(conviteExpirado(expiraEm, new Date("2026-10-16T00:00:00.000Z"))).toBe(true);
    expect(conviteExpirado(null, agora)).toBe(true);
  });

  it("monta a mensagem de WhatsApp com o link", () => {
    expect(mensagemConviteWhatsApp("https://x.test/cadastro/abc")).toContain(
      "https://x.test/cadastro/abc",
    );
  });

  it("o schema público descarta observações internas e tag operacional", () => {
    const resultado = cadastroPublicoClienteSchema.safeParse({
      nome: "Maria Silva",
      dataNascimento: "1990-05-20",
      consentimentoDados: true,
      consentimentoImagem: false,
      observacoesInternas: "não deveria entrar",
      tag: "VIP",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data).not.toHaveProperty("observacoesInternas");
    expect(resultado.data).not.toHaveProperty("tag");
  });
});

describe("enviarCadastroPorWhatsApp", () => {
  it("bloqueia quem não é da equipe ou só tem leitura", async () => {
    mocks.auth.mockResolvedValue({ user: { id: USUARIO, role: "cliente", ativo: true } });
    await expect(enviarCadastroPorWhatsApp({ telefone: "21999281504" })).rejects.toThrow();

    mocks.auth.mockResolvedValue({
      user: { id: USUARIO, role: "profissional", funcao: "reader", ativo: true },
    });
    await expect(enviarCadastroPorWhatsApp({ telefone: "21999281504" })).rejects.toThrow();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("recusa WhatsApp inválido sem criar convite", async () => {
    const resultado = await enviarCadastroPorWhatsApp({ telefone: "1234" });

    expect(resultado.status).toBe("erro");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("cria o convite e envia o link para o número informado", async () => {
    const resultado = await enviarCadastroPorWhatsApp({ telefone: "(21) 99928-1504" });

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ telefone: "(21) 99928-1504", criadoPorId: USUARIO }),
    );
    const { token } = mocks.values.mock.calls[0]![0] as { token: string };
    expect(resultado).toEqual({
      status: "sucesso",
      url: `https://exemplo.test/cadastro/${token}`,
      enviado: true,
      aviso: undefined,
    });
    expect(mocks.enviarWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({ telefone: "(21) 99928-1504" }),
    );
  });

  it("devolve o link com aviso quando o WhatsApp falha", async () => {
    mocks.enviarWhatsApp.mockResolvedValue({ attempted: true, sent: false, error: "Fora do ar" });

    const resultado = await enviarCadastroPorWhatsApp({ telefone: "21999281504" });

    expect(resultado).toMatchObject({ status: "sucesso", enviado: false, aviso: "Fora do ar" });
  });
});

describe("concluirCadastroPublico", () => {
  it("cria o cliente pelo token, sem observações internas e em nome de quem enviou o link", async () => {
    mocks.respostas = [[convite()], [{ id: "reservado" }], [{ id: "cliente-novo" }], []];

    const resultado = await concluirCadastroPublico(
      { status: "inicial" },
      formularioValido({ observacoesInternas: "tentativa do cliente" }),
    );

    expect(resultado).toEqual({ status: "sucesso" });
    expect(mocks.set).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: "concluido" }));
    const inserido = mocks.values.mock.calls[0]![0] as Record<string, unknown>;
    expect(inserido).toMatchObject({ nome: "Maria da Silva", criadoPorId: CRIADOR_CONVITE });
    expect(inserido).not.toHaveProperty("observacoesInternas");
    expect(mocks.set).toHaveBeenLastCalledWith({ clienteId: "cliente-novo" });
  });

  it("exige o consentimento de dados", async () => {
    const dados = formularioValido();
    dados.delete("consentimentoDados");

    const resultado = await concluirCadastroPublico({ status: "inicial" }, dados);

    expect(resultado.campos?.consentimentoDados?.[0]).toContain("autorize");
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("recusa token inexistente, já usado ou expirado sem criar cliente", async () => {
    for (const resposta of [
      [],
      [convite({ status: "concluido" })],
      [convite({ tokenExpiraEm: new Date(Date.now() - 1000) })],
    ]) {
      mocks.respostas = [resposta];
      const resultado = await concluirCadastroPublico({ status: "inicial" }, formularioValido());

      expect(resultado.status).toBe("erro");
    }
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("não cria cliente duplicado quando outro envio reservou o convite antes", async () => {
    mocks.respostas = [[convite()], []];

    const resultado = await concluirCadastroPublico({ status: "inicial" }, formularioValido());

    expect(resultado.status).toBe("erro");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("reabre o convite e aponta o campo quando o e-mail já existe", async () => {
    const duplicado = new Error("Failed query", {
      cause: { constraint: "cliente_email_unique" },
    });
    mocks.respostas = [[convite()], [{ id: "reservado" }], duplicado, []];

    const resultado = await concluirCadastroPublico({ status: "inicial" }, formularioValido());

    expect(resultado.campos?.email?.[0]).toContain("já está cadastrado");
    expect(mocks.set).toHaveBeenLastCalledWith({ status: "pendente", concluidoEm: null });
  });
});
