import { segmentarMensagemWhatsApp } from "@/modules/whatsapp/mensagens";

export function PreviaMensagemWhatsApp({ mensagem }: { mensagem: string }) {
  return (
    <span className="break-words whitespace-pre-wrap">
      {segmentarMensagemWhatsApp(mensagem).map((trecho, indice) => {
        const key = `${indice}-${trecho.formato}`;

        if (trecho.formato === "negrito") return <strong key={key}>{trecho.texto}</strong>;
        if (trecho.formato === "italico") return <em key={key}>{trecho.texto}</em>;
        if (trecho.formato === "riscado") return <s key={key}>{trecho.texto}</s>;
        if (trecho.formato === "monoespaco") {
          return (
            <code className="rounded bg-creme px-1 font-mono text-[0.9em]" key={key}>
              {trecho.texto}
            </code>
          );
        }

        return <span key={key}>{trecho.texto}</span>;
      })}
    </span>
  );
}
