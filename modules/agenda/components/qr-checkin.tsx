import QRCode from "qrcode";

import { urlCheckin } from "@/modules/agenda/checkin-url";

export async function QrCheckin({
  agendamentoId,
  tamanho = 128,
}: {
  agendamentoId: string;
  tamanho?: number;
}) {
  const url = await urlCheckin(agendamentoId);
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: tamanho * 2 });

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URI gerado no servidor, sem otimização de imagem aplicável
    <img
      alt="QR Code para confirmar presença na recepção"
      className="rounded-lg border border-border bg-white p-1"
      height={tamanho}
      src={dataUrl}
      width={tamanho}
    />
  );
}
