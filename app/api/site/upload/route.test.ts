import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), gerarToken: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@vercel/blob/client", () => ({
  handleUpload: async ({
    body,
    onBeforeGenerateToken,
  }: {
    body: { pathname: string; clientPayload: string };
    onBeforeGenerateToken: (pathname: string, clientPayload: string) => Promise<unknown>;
  }) => {
    const opcoes = await onBeforeGenerateToken(body.pathname, body.clientPayload);
    return mocks.gerarToken(opcoes);
  },
}));
import { POST } from "./route";

function requisicao(pathname = "site-publico/video.mp4", clientPayload = "publicacao-autorizada") {
  return new Request("http://localhost/api/site/upload", {
    method: "POST",
    body: JSON.stringify({ pathname, clientPayload }),
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "id", role: "profissional", funcao: "manager" } });
  mocks.gerarToken.mockResolvedValue({
    type: "blob.generate-client-token",
    clientToken: "token-de-teste",
  });
});
describe("Upload editorial", () => {
  it.each([
    null,
    { user: { id: "id", role: "cliente" } },
    { user: { id: "id", role: "recepcao" } },
    { user: { id: "id", role: "profissional", funcao: "reader" } },
  ])("bloqueia emissão de token sem permissão: %j", async (sessao) => {
    mocks.auth.mockResolvedValue(sessao);
    expect([401, 403]).toContain((await POST(requisicao())).status);
    expect(mocks.gerarToken).not.toHaveBeenCalled();
  });
  it("restringe pasta e exige declaração de publicação", async () => {
    expect((await POST(requisicao("clientes/foto.jpg"))).status).toBe(400);
    expect((await POST(requisicao("site-publico/foto.jpg", ""))).status).toBe(400);
    expect((await POST(requisicao("site-publico/arquivo.svg"))).status).toBe(400);
    expect(mocks.gerarToken).not.toHaveBeenCalled();
  });
  it("aceita música de fundo em MP3 e M4A", async () => {
    expect((await POST(requisicao("site-publico/musica.mp3"))).status).toBe(200);
    expect((await POST(requisicao("site-publico/musica.m4a"))).status).toBe(200);
  });
  it("autoriza formatos de foto e vídeo, limita tamanho e impede sobrescrita", async () => {
    expect((await POST(requisicao())).status).toBe(200);
    expect(mocks.gerarToken).toHaveBeenCalledWith(
      expect.objectContaining({
        maximumSizeInBytes: 100 * 1024 * 1024,
        allowOverwrite: false,
        allowedContentTypes: expect.arrayContaining(["video/mp4", "image/jpeg", "audio/mpeg"]),
      }),
    );
  });
});
