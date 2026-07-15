import { describe, expect, it } from "vitest";

import { construirLinkRotaGoogleMaps } from "./rota";

describe("construirLinkRotaGoogleMaps", () => {
  it("retorna null quando não há paradas", () => {
    expect(construirLinkRotaGoogleMaps([])).toBeNull();
  });

  it("retorna null quando nenhuma parada tem endereço", () => {
    const paradas = [{ endereco: null }, { endereco: "" }, { endereco: "   " }];

    expect(construirLinkRotaGoogleMaps(paradas)).toBeNull();
  });

  it("usa o único endereço como destino, sem waypoints", () => {
    const link = construirLinkRotaGoogleMaps([{ endereco: "Rua A, 100" }]);

    expect(link).toBe("https://www.google.com/maps/dir/?api=1&destination=Rua+A%2C+100");
  });

  it("usa o último endereço como destino e os demais como waypoints, na ordem", () => {
    const link = construirLinkRotaGoogleMaps([
      { endereco: "Rua A, 100" },
      { endereco: "Rua B, 200" },
      { endereco: "Rua C, 300" },
    ]);

    expect(link).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=Rua+C%2C+300&waypoints=Rua+A%2C+100%7CRua+B%2C+200",
    );
  });

  it("ignora paradas sem endereço no meio da lista, mantendo a ordem das válidas", () => {
    const link = construirLinkRotaGoogleMaps([
      { endereco: "Rua A, 100" },
      { endereco: null },
      { endereco: "Rua B, 200" },
    ]);

    expect(link).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=Rua+B%2C+200&waypoints=Rua+A%2C+100",
    );
  });
});
