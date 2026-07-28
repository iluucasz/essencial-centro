import { describe, expect, it } from "vitest";

import {
  documentoVisivelAoCliente,
  tiposDocumento,
  tiposDocumentoSomenteProfissional,
} from "./schema";

/**
 * A tabela `documento` é majoritariamente feita para o cliente ler e assinar no portal, então um
 * tipo novo entra visível por padrão. Estes testes travam a exceção: material clínico interno
 * (biorressonância) nunca pode virar visível por descuido.
 */
describe("visibilidade de documento para o cliente", () => {
  it("esconde a biorressonância do cliente — é leitura clínica da profissional", () => {
    expect(documentoVisivelAoCliente("biorressonancia")).toBe(false);
  });

  it("mantém visíveis os documentos que o cliente precisa ler e assinar", () => {
    expect(documentoVisivelAoCliente("contrato_prestacao_servicos")).toBe(true);
    expect(documentoVisivelAoCliente("termo_responsabilidade")).toBe(true);
    expect(documentoVisivelAoCliente("termo_autorizacao_imagem")).toBe(true);
    expect(documentoVisivelAoCliente("orientacao")).toBe(true);
    expect(documentoVisivelAoCliente("outro")).toBe(true);
  });

  it("só marca como interno o que está na lista, e a lista é de tipos válidos", () => {
    for (const tipo of tiposDocumentoSomenteProfissional) {
      expect(tiposDocumento).toContain(tipo);
      expect(documentoVisivelAoCliente(tipo)).toBe(false);
    }
  });
});
