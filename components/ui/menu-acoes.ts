"use client";

import { useLayoutEffect, useRef, useState } from "react";

const ESPACO_MINIMO_ABAIXO_PX = 200;

/**
 * Decide se um menu de ações (dropdown de 3 pontos) deve abrir para cima em vez de para
 * baixo — sem isso, o menu fica cortado quando o gatilho está perto do fim de uma lista
 * ou tabela rolável (última linha da página, por exemplo).
 */
export function usePosicaoMenuAcoes(aberto: boolean) {
  const gatilhoRef = useRef<HTMLDivElement>(null);
  const [abrirParaCima, setAbrirParaCima] = useState(false);

  useLayoutEffect(() => {
    if (!aberto || !gatilhoRef.current) return;

    const espacoAbaixo = window.innerHeight - gatilhoRef.current.getBoundingClientRect().bottom;

    setAbrirParaCima(espacoAbaixo < ESPACO_MINIMO_ABAIXO_PX);
  }, [aberto]);

  return { gatilhoRef, abrirParaCima };
}
