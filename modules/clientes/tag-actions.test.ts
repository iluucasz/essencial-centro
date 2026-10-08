import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cadeia = {
    set: vi.fn(),
    where: vi.fn(),
  };
  cadeia.set.mockReturnValue(cadeia);
  cadeia.where.mockReturnValue(cadeia);

  return {
    auth: vi.fn(),
    batch: vi.fn(),
    revalidatePath: vi.fn(),
    update: vi.fn(() => cadeia),
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/db", () => ({ db: { batch: mocks.batch, update: mocks.update } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { atribuirTagClientes } from "./tag-actions";

const CLIENTE_1 = "11111111-1111-4111-8111-111111111111";
const CLIENTE_2 = "22222222-2222-4222-8222-222222222222";

function formulario(tag = "VIP", ids = [CLIENTE_1, CLIENTE_2]) {
  const dados = new FormData();
  dados.set("tag", tag);
  for (const id of ids) dados.append("clienteIds", id);
  return dados;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: "33333333-3333-4333-8333-333333333333", role: "profissional", funcao: "manager" },
  });
});

describe("atribuirTagClientes", () => {
  it("sincroniza os participantes e revalida clientes e WhatsApp", async () => {
    const resultado = await atribuirTagClientes({ status: "inicial" }, formulario("  VIP  "));

    expect(resultado).toEqual({ status: "sucesso", mensagem: "Tag atribuída a 2 clientes." });
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(mocks.batch).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel/clientes");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/painel/whatsapp");
  });

  it("exige nome e pelo menos um cliente", async () => {
    const resultado = await atribuirTagClientes({ status: "inicial" }, formulario(" ", []));

    expect(resultado.status).toBe("erro");
    expect(resultado.campos?.tag).toBeDefined();
    expect(resultado.campos?.clienteIds).toBeDefined();
    expect(mocks.batch).not.toHaveBeenCalled();
  });

  it("bloqueia cliente e função somente leitura antes de alterar dados", async () => {
    mocks.auth.mockResolvedValue({ user: { id: CLIENTE_1, role: "cliente", ativo: true } });
    await expect(atribuirTagClientes({ status: "inicial" }, formulario())).rejects.toThrow();

    mocks.auth.mockResolvedValue({
      user: { id: CLIENTE_1, role: "recepcao", funcao: "reader", ativo: true },
    });
    await expect(atribuirTagClientes({ status: "inicial" }, formulario())).rejects.toThrow();
    expect(mocks.batch).not.toHaveBeenCalled();
  });
});
