import { headers } from "next/headers";
import QRCode from "qrcode";

async function gerarUrlCheckin(agendamentoId: string) {
  const listaHeaders = await headers();
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";

  return `${protocolo}://${host}/painel/checkin/${agendamentoId}`;
}

export async function QrCheckin({ agendamentoId }: { agendamentoId: string }) {
  const url = await gerarUrlCheckin(agendamentoId);
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 128 });

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URI gerado no servidor, sem otimização de imagem aplicável
    <img
      alt="QR Code para confirmar presença na recepção"
      className="size-28 rounded-lg border border-border bg-white p-1"
      src={dataUrl}
    />
  );
}
