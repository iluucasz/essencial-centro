// Dados de demonstração (UI-only). Nada é persistido.

export type ClientStatus = "Ativa" | "Avaliação" | "Concluída"

export type Client = {
  id: string
  name: string
  service: string
  status: ClientStatus
  sessionsDone: number
  sessionsTotal: number
  lastVisit: string
  nextVisit?: string
  initials: string
}

export const CLIENTS: Client[] = [
  {
    id: "ana-souza",
    name: "Ana Souza",
    service: "Estética Corporal",
    status: "Ativa",
    sessionsDone: 6,
    sessionsTotal: 10,
    lastVisit: "12 jul",
    nextVisit: "19 jul, 14h",
    initials: "AS",
  },
  {
    id: "beatriz-lima",
    name: "Beatriz Lima",
    service: "Massoterapia",
    status: "Ativa",
    sessionsDone: 3,
    sessionsTotal: 8,
    lastVisit: "10 jul",
    nextVisit: "18 jul, 10h",
    initials: "BL",
  },
  {
    id: "carla-mendes",
    name: "Carla Mendes",
    service: "Ozonioterapia",
    status: "Avaliação",
    sessionsDone: 0,
    sessionsTotal: 15,
    lastVisit: "—",
    nextVisit: "17 jul, 16h",
    initials: "CM",
  },
  {
    id: "daniela-rocha",
    name: "Daniela Rocha",
    service: "Extensão de Cílios",
    status: "Concluída",
    sessionsDone: 4,
    sessionsTotal: 4,
    lastVisit: "28 jun",
    initials: "DR",
  },
  {
    id: "elaine-castro",
    name: "Elaine Castro",
    service: "Limpeza de Pele",
    status: "Ativa",
    sessionsDone: 2,
    sessionsTotal: 6,
    lastVisit: "09 jul",
    nextVisit: "23 jul, 09h",
    initials: "EC",
  },
  {
    id: "fernanda-alves",
    name: "Fernanda Alves",
    service: "Terapia Capilar",
    status: "Ativa",
    sessionsDone: 5,
    sessionsTotal: 10,
    lastVisit: "11 jul",
    nextVisit: "20 jul, 15h",
    initials: "FA",
  },
]

export type Appointment = {
  time: string
  client: string
  service: string
  duration: string
  status: "Confirmado" | "Aguardando" | "Avaliação"
}

export const TODAY_APPOINTMENTS: Appointment[] = [
  { time: "09:00", client: "Elaine Castro", service: "Limpeza de Pele", duration: "50 min", status: "Confirmado" },
  { time: "10:30", client: "Beatriz Lima", service: "Massoterapia", duration: "60 min", status: "Confirmado" },
  { time: "14:00", client: "Ana Souza", service: "Estética Corporal", duration: "60 min", status: "Confirmado" },
  { time: "16:00", client: "Carla Mendes", service: "Ozonioterapia", duration: "40 min", status: "Avaliação" },
  { time: "17:30", client: "Fernanda Alves", service: "Terapia Capilar", duration: "45 min", status: "Aguardando" },
]

export const DASHBOARD_STATS = [
  { label: "Clientes ativas", value: "48", change: "+6 este mês" },
  { label: "Sessões na semana", value: "27", change: "5 hoje" },
  { label: "Avaliações pendentes", value: "3", change: "para revisar" },
  { label: "Taxa de retorno", value: "92%", change: "+4% vs. mês anterior" },
]

// Evolução de medidas (cm) — para gráfico simples
export const MEASUREMENTS = [
  { session: "S1", cintura: 84, abdomen: 92, quadril: 104 },
  { session: "S2", cintura: 82, abdomen: 90, quadril: 103 },
  { session: "S3", cintura: 81, abdomen: 88, quadril: 102 },
  { session: "S4", cintura: 79, abdomen: 86, quadril: 100 },
  { session: "S5", cintura: 78, abdomen: 85, quadril: 99 },
  { session: "S6", cintura: 76, abdomen: 83, quadril: 98 },
]

export type SessionLog = {
  date: string
  session: string
  note: string
  pain?: number
}

export const SESSION_HISTORY: SessionLog[] = [
  { date: "12 jul", session: "Sessão 6", note: "Boa resposta ao protocolo. Redução visível na região abdominal.", pain: 1 },
  { date: "05 jul", session: "Sessão 5", note: "Cliente relatou menos retenção. Ajuste de intensidade.", pain: 2 },
  { date: "28 jun", session: "Sessão 4", note: "Medidas registradas. Orientação de hidratação reforçada.", pain: 2 },
  { date: "21 jun", session: "Sessão 3", note: "Evolução dentro do esperado. Fotos autorizadas registradas.", pain: 3 },
]

export type ClientDocument = {
  name: string
  type: string
  date: string
  signed: boolean
}

export const CLIENT_DOCUMENTS: ClientDocument[] = [
  { name: "Termo de consentimento — Estética Corporal", type: "Termo", date: "20 jun", signed: true },
  { name: "Autorização de uso de imagem", type: "Autorização", date: "20 jun", signed: true },
  { name: "Anamnese corporal completa", type: "Ficha", date: "20 jun", signed: true },
  { name: "Plano de tratamento — 10 sessões", type: "Plano", date: "21 jun", signed: false },
]

export const CLIENT_NEXT_SESSIONS = [
  { date: "19 jul", time: "14:00", service: "Estética Corporal — Sessão 7", place: "Sala 2" },
  { date: "26 jul", time: "14:00", service: "Estética Corporal — Sessão 8", place: "Sala 2" },
  { date: "02 ago", time: "14:00", service: "Estética Corporal — Sessão 9", place: "Sala 2" },
]

export const CLIENT_GUIDANCE = [
  "Beba ao menos 2L de água por dia para potencializar os resultados.",
  "Evite exposição solar direta na área tratada por 24h.",
  "Mantenha a pele hidratada com o creme recomendado.",
  "Pratique atividade física leve entre as sessões.",
]
