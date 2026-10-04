import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServicesSection } from "./services-section";
import { ContactSection } from "./contact-section";
import { CLINIC, SERVICES } from "@/lib/marketing/clinic";
import { blocoCatalogoPadrao } from "@/modules/site-publico/blocos";
import { HeroSection } from "./hero-section";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// O conteúdo do slide entra com fade (opacidade 0 → 1), que o jsdom não anima: por isso
// os textos do catálogo são verificados pela presença na página, não por "visível".
describe("Catálogo público da Essencial", () => {
  it("permite consultar as sete categorias sem login e encaminha o serviço escolhido", async () => {
    const user = userEvent.setup();
    render(<ServicesSection />);
    const categorias = screen.getByRole("group", { name: "Categorias de atendimento" });
    expect(within(categorias).getAllByRole("button")).toHaveLength(7);
    for (const servico of SERVICES) {
      const botao = within(categorias).getByRole("button", { name: servico.name });
      await user.click(botao);
      expect(botao).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { name: servico.name })).toBeInTheDocument();
      for (const tratamento of servico.treatments)
        expect(screen.getByText(tratamento)).toBeInTheDocument();
      const destino = new URL(
        screen.getByRole("link", { name: /^Conversar sobre/ }).getAttribute("href")!,
      );
      expect(destino.origin + destino.pathname).toBe(`https://wa.me/${CLINIC.whatsapp}`);
      expect(destino.searchParams.get("text")).toContain(servico.name);
    }
  });

  it("mostra todas as artes com seus textos e navega circularmente pelas setas", async () => {
    const user = userEvent.setup();
    render(<ServicesSection />);
    for (const servico of SERVICES) {
      for (const catalogo of servico.catalogs ?? [{ title: servico.name }]) {
        expect(screen.getByRole("heading", { name: servico.name })).toBeInTheDocument();
        expect(screen.getByText(servico.description)).toBeInTheDocument();
        const ampliar = screen.getByRole("link", { name: `Ampliar imagem: ${catalogo.title}` });
        expect(within(ampliar).getByRole("img")).toBeInTheDocument();
        if ("image" in catalogo) expect(ampliar).toHaveAttribute("href", catalogo.image);
        expect(screen.getByRole("button", { name: `Ver ${catalogo.title}` })).toHaveAttribute(
          "aria-current",
          "true",
        );
        await user.click(screen.getByRole("button", { name: "Próximo plano" }));
      }
    }
    expect(screen.getByRole("status")).toHaveTextContent("01 / 10");
    await user.click(screen.getByRole("button", { name: "Plano anterior" }));
    expect(screen.getByRole("heading", { name: "Podologia" })).toBeInTheDocument();
  });

  it("permite escolher pelas bolinhas e navegar pelo teclado", async () => {
    const user = userEvent.setup();
    render(<ServicesSection />);
    await user.click(screen.getByRole("button", { name: "Ver Estética facial avançada" }));
    expect(screen.getByRole("status")).toHaveTextContent("05 / 10");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: "Terapia ortomolecular" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("status")).toHaveTextContent("05 / 10");
  });

  it("avança ao deslizar horizontalmente, preservando a rolagem vertical", () => {
    render(<ServicesSection />);
    const card = document.getElementById("detalhes-servico")!;
    fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100, clientY: 110 }] });
    expect(screen.getByRole("status")).toHaveTextContent("02 / 10");
    fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 200, clientY: 110 }] });
    expect(screen.getByRole("status")).toHaveTextContent("01 / 10");
    fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100, clientY: 300 }] });
    expect(screen.getByRole("status")).toHaveTextContent("01 / 10");
  });

  it("troca a cada cinco segundos, permite pausar e reinicia o tempo na navegação manual", () => {
    vi.useFakeTimers();
    render(<ServicesSection />);
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole("status")).toHaveTextContent("01 / 10");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toHaveTextContent("02 / 10");
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.click(screen.getByRole("button", { name: "Próximo plano" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).toHaveTextContent("03 / 10");
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("status")).toHaveTextContent("04 / 10");
    fireEvent.click(screen.getByRole("button", { name: "Pausar troca automática" }));
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole("status")).toHaveTextContent("04 / 10");
    fireEvent.click(screen.getByRole("button", { name: "Retomar troca automática" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("status")).toHaveTextContent("05 / 10");
  });

  it("pausa a troca automática durante a navegação por teclado e limpa o temporizador ao sair", () => {
    vi.useFakeTimers();
    const { unmount } = render(<ServicesSection />);
    const carrossel = screen.getByRole("region", { name: "Planos e cuidados da Essencial" });
    fireEvent.focus(carrossel);
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole("status")).toHaveTextContent("01 / 10");
    fireEvent.blur(carrossel, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("status")).toHaveTextContent("02 / 10");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("oferece uma mensagem revisável sem fingir envio nem coletar dados clínicos", async () => {
    const user = userEvent.setup();
    render(<ContactSection />);
    await user.selectOptions(screen.getByRole("combobox"), "Podologia");
    const link = screen.getByRole("link", { name: "Continuar no WhatsApp" });
    expect(new URL(link.getAttribute("href")!).searchParams.get("text")).toContain("Podologia");
    expect(screen.queryByText("Recebemos seu pedido")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("usa o catálogo editado: título em várias linhas, categorias e capa padrão sem arte", () => {
    render(
      <ServicesSection
        catalogo={{
          ...blocoCatalogoPadrao,
          titulo: "Linha um\nLinha dois",
          aviso: "",
          categorias: [
            {
              slug: "nova",
              nome: "Reiki",
              chamada: "Energia",
              descricao: "Descrição do reiki.",
              icone: "sol",
              tratamentos: ["Sessão de reiki"],
              paginas: [],
            },
          ],
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2 }).innerHTML).toContain("<br>");
    expect(screen.getByRole("heading", { name: "Reiki" })).toBeInTheDocument();
    expect(screen.getByText("Sessão de reiki")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("01 / 01");
    expect(screen.queryByText(/Cada pessoa tem uma história/)).not.toBeInTheDocument();
  });

  it("categorias viram barras de progresso: a ativa anima, pausa junto e as anteriores ficam cheias", async () => {
    const user = userEvent.setup();
    render(<ServicesSection />);
    const categorias = screen.getByRole("group", { name: "Categorias de atendimento" });
    const barraDe = (nome: string) =>
      within(categorias)
        .getByRole("button", { name: nome })
        .querySelector<HTMLElement>(".origin-left");

    expect(barraDe("Estética corporal")?.style.animation).toContain("catalogo-progresso");
    await user.click(within(categorias).getByRole("button", { name: "Massoterapia" }));
    expect(within(categorias).getByRole("button", { name: "Massoterapia" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(barraDe("Estética corporal")).toBeNull();
    expect(
      within(categorias)
        .getByRole("button", { name: "Estética corporal" })
        .querySelector('[class~="bg-brand/40"]'),
    ).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Pausar troca automática" }));
    expect(barraDe("Massoterapia")?.style.animation ?? "").toBe("");
  });

  it("seção inicial e faixa mostram os textos editados", () => {
    render(
      <HeroSection
        textos={{
          selo: "Selo novo",
          tituloLinha1: "Linha A",
          tituloLinha2: "Linha B",
          chamada: "Chamada nova",
          paragrafo: "Parágrafo novo",
          botaoPrincipal: "Agendar agora",
          botaoSecundario: "Ver cuidados",
          rodape: "",
        }}
        faixa={{ palavras: ["Um", "Dois"] }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Linha ALinha B");
    expect(screen.getByRole("link", { name: /Agendar agora/ })).toBeVisible();
    expect(screen.getByText("Um")).toBeVisible();
    expect(screen.getByText("Dois")).toBeVisible();
    expect(screen.queryByText("Qualidade de vida")).not.toBeInTheDocument();
  });
});
