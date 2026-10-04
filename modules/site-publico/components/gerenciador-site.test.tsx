import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  blocoCatalogoPadrao,
  blocoContatoPadrao,
  blocoDuvidasPadrao,
  blocoFaixaPadrao,
  blocoInicioPadrao,
  blocosPadrao,
} from "../blocos";
import type { ConteudoSite } from "../schema";

const mocks = vi.hoisted(() => ({
  salvar: vi.fn(),
  alternar: vi.fn(),
  mover: vi.fn(),
  excluir: vi.fn(),
  salvarBloco: vi.fn(),
  restaurarBloco: vi.fn(),
  upload: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("../actions", () => ({
  salvarConteudoSite: mocks.salvar,
  alternarPublicacaoConteudo: mocks.alternar,
  moverConteudo: mocks.mover,
  excluirConteudoSite: mocks.excluir,
  salvarBlocoSite: mocks.salvarBloco,
  restaurarBlocoSite: mocks.restaurarBloco,
}));
vi.mock("@vercel/blob/client", () => ({ upload: mocks.upload }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));

import { EditorCatalogo, EditorFaixa, EditorInicio } from "./editores-blocos";
import { EditorContato, EditorDuvidas } from "./editores-secoes";
import { FormularioConteudo } from "./formulario-conteudo";
import { GerenciadorSite } from "./gerenciador-site";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function conteudo(dados: Partial<ConteudoSite>): ConteudoSite {
  return {
    id: crypto.randomUUID(),
    tipo: "destaque",
    titulo: "Foto",
    subtitulo: "",
    texto: "",
    tipoMidia: "imagem",
    midia: "/images/foto.jpg",
    ordem: 0,
    filtro: "original",
    somOriginal: true,
    musica: "",
    volumeMusica: 60,
    nota: null,
    publicado: true,
    autorizacaoPublicacao: true,
    atualizadoPorId: null,
    atualizadoEm: new Date(),
    ...dados,
  };
}

describe("Formulário de conteúdo do site", () => {
  it("só libera o envio após a autorização e publica o vídeo enviado", async () => {
    mocks.upload.mockResolvedValue({
      url: "https://loja.public.blob.vercel-storage.com/site-publico/video.mp4",
    });
    mocks.salvar.mockResolvedValue({ sucesso: true, mensagem: "Publicado no site." });
    const aoConcluir = vi.fn();
    const user = userEvent.setup();
    render(<FormularioConteudo tipo="destaque" aoConcluir={aoConcluir} />);

    const arquivo = screen.getByLabelText("Foto ou vídeo");
    expect(arquivo).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /Tenho autorização/ }));
    await user.upload(arquivo, new File(["video"], "video.mp4", { type: "video/mp4" }));
    await user.type(screen.getByLabelText("Legenda"), "Conheça nosso espaço");
    await user.click(screen.getByRole("button", { name: "Publicar no site" }));

    await waitFor(() =>
      expect(mocks.salvar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "destaque",
          titulo: "Conheça nosso espaço",
          tipoMidia: "video",
          publicado: true,
          autorizacaoPublicacao: true,
        }),
      ),
    );
    expect(aoConcluir).toHaveBeenCalledWith("Publicado no site.");
  });

  it("depoimento usa campos próprios, envia a nota escolhida e pode ficar como rascunho", async () => {
    mocks.salvar.mockResolvedValue({ sucesso: true, mensagem: "Rascunho salvo." });
    const user = userEvent.setup();
    render(<FormularioConteudo tipo="depoimento" aoConcluir={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome do cliente"), "Maria S.");
    await user.type(screen.getByLabelText("Depoimento"), "Fui muito bem atendida.");
    await user.click(screen.getByRole("radio", { name: "4 estrelas" }));
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() =>
      expect(mocks.salvar).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: "depoimento", nota: 4, publicado: false }),
      ),
    );
  });

  it("salva filtro e som do vídeo escolhidos nos ajustes da mídia", async () => {
    mocks.salvar.mockResolvedValue({ sucesso: true, mensagem: "Publicado no site." });
    const user = userEvent.setup();
    render(
      <FormularioConteudo
        tipo="destaque"
        item={conteudo({
          tipoMidia: "video",
          midia: "https://loja.public.blob.vercel-storage.com/site-publico/video.mp4",
        })}
        aoConcluir={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Vivo" }));
    await user.click(screen.getByRole("checkbox", { name: "Manter o som original do vídeo" }));
    expect(screen.getByLabelText("Música de fundo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publicar no site" }));
    await waitFor(() =>
      expect(mocks.salvar).toHaveBeenCalledWith(
        expect.objectContaining({ filtro: "vivo", somOriginal: false, musica: "" }),
      ),
    );
  });

  it("foto oferece filtro, mas não som nem música", () => {
    render(<FormularioConteudo tipo="destaque" item={conteudo({})} aoConcluir={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "Retrô" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Música de fundo")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /som original/ })).not.toBeInTheDocument();
  });

  it("mostra o motivo quando o servidor recusa", async () => {
    mocks.salvar.mockResolvedValue({
      sucesso: false,
      mensagem: "Confirme a autorização para publicar.",
    });
    const aoConcluir = vi.fn();
    const user = userEvent.setup();
    render(<FormularioConteudo tipo="profissional" aoConcluir={aoConcluir} />);
    await user.click(screen.getByRole("button", { name: "Publicar no site" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Confirme a autorização");
    expect(aoConcluir).not.toHaveBeenCalled();
  });
});

describe("Gerenciador do conteúdo do site", () => {
  const itens = [
    conteudo({ titulo: "Primeira foto", ordem: 0 }),
    conteudo({ titulo: "Segunda foto", ordem: 1, publicado: false }),
    conteudo({ tipo: "profissional", titulo: "Edvania" }),
  ];

  it("separa as seções em abas com a contagem e o estado vazio", async () => {
    const user = userEvent.setup();
    render(<GerenciadorSite itens={itens} blocos={blocosPadrao()} somenteLeitura={false} />);
    expect(screen.getByRole("tab", { name: "Seção inicial" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Textos da seção inicial" })).toBeVisible();
    expect(screen.getByText("Rascunho")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: /Depoimentoss*0/ }));
    expect(screen.getByText(/Nenhum depoimento publicado/)).toBeVisible();
    expect(screen.queryByText("Primeira foto")).not.toBeInTheDocument();
  });

  it("publica, oculta e reordena pelos botões do card", async () => {
    mocks.alternar.mockResolvedValue({ sucesso: true, mensagem: "Publicado no site." });
    mocks.mover.mockResolvedValue({ sucesso: true, mensagem: "" });
    const user = userEvent.setup();
    render(<GerenciadorSite itens={itens} blocos={blocosPadrao()} somenteLeitura={false} />);

    expect(screen.getByRole("button", { name: "Mover Primeira foto para antes" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Publicar Segunda foto" }));
    await waitFor(() => expect(mocks.alternar).toHaveBeenCalledWith(itens[1].id, true));
    await user.click(screen.getByRole("button", { name: "Mover Segunda foto para antes" }));
    await waitFor(() => expect(mocks.mover).toHaveBeenCalledWith(itens[1].id, "acima"));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("não oferece edição para a função somente leitura", () => {
    render(<GerenciadorSite itens={itens} blocos={blocosPadrao()} somenteLeitura />);
    expect(screen.queryByRole("button", { name: /Adicionar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument();
  });
});

describe("Textos editáveis do site", () => {
  it("faixa: adiciona, reordena e publica as palavras", async () => {
    mocks.salvarBloco.mockResolvedValue({
      sucesso: true,
      mensagem: "Alterações publicadas no site.",
    });
    const user = userEvent.setup();
    render(<EditorFaixa valor={blocoFaixaPadrao} personalizado={false} somenteLeitura={false} />);
    await user.click(screen.getByRole("button", { name: "Adicionar palavra" }));
    await user.type(screen.getByLabelText("Palavra 4"), "Autocuidado");
    await user.click(screen.getByRole("button", { name: "Mover palavra 4 para antes" }));
    await user.click(screen.getByRole("button", { name: "Publicar alterações" }));
    await waitFor(() =>
      expect(mocks.salvarBloco).toHaveBeenCalledWith("faixa", {
        palavras: ["Autoestima", "Bem-estar", "Autocuidado", "Qualidade de vida"],
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("publicadas");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("seção inicial: valida no navegador e diz qual campo falta", async () => {
    const user = userEvent.setup();
    render(<EditorInicio valor={blocoInicioPadrao} personalizado={false} somenteLeitura={false} />);
    await user.clear(screen.getByLabelText(/Título \(2ª linha\)/));
    await user.click(screen.getByRole("button", { name: "Publicar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Título (2ª linha)");
    expect(mocks.salvarBloco).not.toHaveBeenCalled();
  });

  it("catálogo: edita uma categoria, limpa linhas vazias dos tratamentos e publica", async () => {
    mocks.salvarBloco.mockResolvedValue({ sucesso: true, mensagem: "ok" });
    const user = userEvent.setup();
    render(
      <EditorCatalogo valor={blocoCatalogoPadrao} personalizado={false} somenteLeitura={false} />,
    );
    await user.click(screen.getByRole("button", { name: /^Podologia\s*\d+ tratamentos/ }));
    const nome = screen.getByLabelText("Nome da categoria");
    await user.clear(nome);
    await user.type(nome, "Podologia clínica");
    await user.type(screen.getByLabelText(/Tratamentos/), "{Enter}{Enter}Reflexologia");
    await user.click(screen.getByRole("button", { name: "Publicar alterações" }));
    await waitFor(() => expect(mocks.salvarBloco).toHaveBeenCalled());
    const [chave, valor] = mocks.salvarBloco.mock.calls[0];
    expect(chave).toBe("catalogo");
    const podologia = valor.categorias.find(
      (categoria: { slug: string }) => categoria.slug === "podologia",
    );
    expect(podologia.nome).toBe("Podologia clínica");
    expect(podologia.tratamentos).toEqual([
      "Avaliação dos pés",
      "Cuidados podológicos",
      "Reflexologia",
    ]);
  });

  it("restaura o texto original só depois de confirmar", async () => {
    mocks.restaurarBloco.mockResolvedValue({
      sucesso: true,
      mensagem: "Textos originais restaurados.",
    });
    const user = userEvent.setup();
    render(<EditorFaixa valor={blocoFaixaPadrao} personalizado somenteLeitura={false} />);
    await user.click(screen.getByRole("button", { name: "Restaurar texto original" }));
    expect(mocks.restaurarBloco).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Sim, restaurar" }));
    await waitFor(() => expect(mocks.restaurarBloco).toHaveBeenCalledWith("faixa"));
  });

  it("função somente leitura não publica nem restaura", () => {
    render(<EditorFaixa valor={blocoFaixaPadrao} personalizado somenteLeitura />);
    expect(screen.queryByRole("button", { name: "Publicar alterações" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Palavra 1")).toBeDisabled();
  });

  it("contato recusa telefone sem DDD antes de enviar", async () => {
    const user = userEvent.setup();
    render(
      <EditorContato valor={blocoContatoPadrao} personalizado={false} somenteLeitura={false} />,
    );
    const telefone = screen.getByLabelText(/Telefone \/ WhatsApp/);
    await user.clear(telefone);
    await user.type(telefone, "9999");
    await user.click(screen.getByRole("button", { name: "Publicar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telefone: Informe um telefone com DDD.",
    );
    expect(mocks.salvarBloco).not.toHaveBeenCalled();
  });

  it("dúvidas: adiciona uma pergunta nova e publica", async () => {
    mocks.salvarBloco.mockResolvedValue({ sucesso: true, mensagem: "ok" });
    const user = userEvent.setup();
    render(
      <EditorDuvidas valor={blocoDuvidasPadrao} personalizado={false} somenteLeitura={false} />,
    );
    await user.click(screen.getByRole("button", { name: "Adicionar pergunta" }));
    const total = blocoDuvidasPadrao.perguntas.length + 1;
    await user.type(screen.getByLabelText(`Pergunta ${total}`), "Aceitam cartão?");
    await user.type(screen.getAllByLabelText("Resposta").at(-1)!, "Sim, débito e crédito.");
    await user.click(screen.getByRole("button", { name: "Publicar alterações" }));
    await waitFor(() => expect(mocks.salvarBloco).toHaveBeenCalled());
    const [chave, valor] = mocks.salvarBloco.mock.calls[0];
    expect(chave).toBe("duvidas");
    expect(valor.perguntas.at(-1)).toEqual({
      pergunta: "Aceitam cartão?",
      resposta: "Sim, débito e crédito.",
    });
  });

  it("todas as seções do site têm uma aba, na ordem da página", () => {
    render(<GerenciadorSite itens={[]} blocos={blocosPadrao()} somenteLeitura={false} />);
    expect(screen.getAllByRole("tab").map((aba) => aba.textContent?.replace(/\d+$/, ""))).toEqual([
      "Seção inicial",
      "Faixa",
      "Catálogo",
      "Como funciona",
      "Sobre",
      "Profissionais",
      "Depoimentos",
      "Login",
      "Dúvidas frequentes",
      "Contato",
      "Rodapé",
    ]);
  });
});
