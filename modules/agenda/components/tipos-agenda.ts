import type { ModalidadeAtendimento, StatusAgendamento } from "@/modules/agenda/schema";

export type AgendamentoResumo = {
  id: string;
  clienteId: string;
  profissionalId?: string | null;
  servicoId?: string | null;
  inicio: Date;
  duracaoMinutos: number;
  status: StatusAgendamento;
  modalidade: ModalidadeAtendimento;
  observacoes: string | null;
  checkinEm: Date | null;
  pacoteId: string | null;
  clienteNome: string;
  servicoNome: string;
  servicoValorCentavos: number | null;
  profissionalNome: string | null;
  pacoteQuantidadeSessoes: number | null;
  pacoteSituacaoPagamento: "pendente" | "parcial" | "pago" | null;
  pacoteValorCentavos: number | null;
};
