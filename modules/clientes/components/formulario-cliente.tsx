"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import {
  type CamposEnderecoCliente,
  extrairEnderecoCliente,
  formatarCep,
  montarEnderecoCliente,
  normalizarCep,
  ufsBrasil,
} from "@/modules/clientes/endereco";
import {
  atualizarCliente,
  criarCliente,
  type EstadoFormularioCliente,
} from "@/modules/clientes/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";

const estadoInicial: EstadoFormularioCliente = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-24 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export type ClienteFormulario = {
  id: string;
  nome: string;
  dataNascimento: Date;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  contatoEmergenciaNome: string | null;
  contatoEmergenciaTelefone: string | null;
  profissao: string | null;
  objetivoTratamento: string | null;
  alergias: string | null;
  medicamentos: string | null;
  condicoesSaude: string | null;
  cirurgias: string | null;
  contraindicacoes: string | null;
  consentimentoDados: boolean;
  consentimentoImagem: boolean;
  observacoesInternas: string | null;
};

function valorInicial(valor: string | null | undefined) {
  return valor ?? undefined;
}

function formatarDataInput(data?: Date | null) {
  if (!data) return undefined;

  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function MensagemFormulario({ state }: { state: EstadoFormularioCliente | undefined }) {
  if (!state?.mensagem) return null;

  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium",
        state.status === "erro" ? "bg-perigo/10 text-perigo" : "bg-brand/10 text-brand",
      )}
      role={state.status === "erro" ? "alert" : "status"}
    >
      {state.mensagem}
    </p>
  );
}

function CampoTexto({
  defaultValue,
  error,
  inputMode,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string;
  error?: string[];
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeCampo}
        defaultValue={defaultValue}
        id={name}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function CampoArea({
  defaultValue,
  error,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
  placeholder?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <textarea
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeArea}
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function CampoCheckbox({
  defaultChecked,
  error,
  label,
  name,
  required,
}: {
  defaultChecked?: boolean;
  error?: string[];
  label: string;
  name: string;
  required?: boolean;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="flex items-start gap-3 text-sm text-foreground" htmlFor={name}>
        <input
          aria-describedby={error?.length ? errorId : undefined}
          aria-invalid={error?.length ? true : undefined}
          className="mt-1 size-4 rounded border-border text-brand focus:ring-roxo"
          defaultChecked={defaultChecked}
          id={name}
          name={name}
          required={required}
          type="checkbox"
        />
        <span>{label}</span>
      </label>
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

type RespostaViaCep = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

type StatusCep = {
  tipo: "inicial" | "carregando" | "sucesso" | "erro";
  mensagem?: string;
};

type RespostaMunicipioIbge = {
  nome: string;
};

type CidadesDaUf = {
  uf: string;
  cidades: string[];
  status: "sucesso" | "erro";
  mensagem?: string;
};

function CampoEnderecoTexto({
  id,
  inputMode,
  label,
  maxLength,
  onChange,
  placeholder,
  value,
}: {
  id: keyof CamposEnderecoCliente;
  inputMode?: "numeric" | "text";
  label: string;
  maxLength?: number;
  onChange: (campo: keyof CamposEnderecoCliente, value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={`endereco-${id}`}>
        {label}
      </label>
      <input
        className={classeCampo}
        id={`endereco-${id}`}
        inputMode={inputMode}
        maxLength={maxLength}
        name={`endereco_${id}`}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}

function CampoEndereco({ defaultValue, error }: { defaultValue?: string; error?: string[] }) {
  const enderecoInicial = extrairEnderecoCliente(defaultValue);
  const [endereco, setEndereco] = useState<CamposEnderecoCliente>(enderecoInicial);
  const [statusCep, setStatusCep] = useState<StatusCep>(() =>
    normalizarCep(enderecoInicial.cep).length === 8
      ? { tipo: "carregando", mensagem: "Buscando endereço pelo CEP..." }
      : { tipo: "inicial" },
  );
  const cepNormalizado = normalizarCep(endereco.cep);
  const cepCompleto = cepNormalizado.length === 8;
  const enderecoComposto = useMemo(() => montarEnderecoCliente(endereco), [endereco]);
  const errorId = "endereco-erro";
  const [cidadesDaUf, setCidadesDaUf] = useState<CidadesDaUf | null>(null);

  useEffect(() => {
    if (cepNormalizado.length !== 8) return;

    const controller = new AbortController();

    fetch(`https://viacep.com.br/ws/${cepNormalizado}/json/`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao consultar CEP.");

        const dados = (await response.json()) as RespostaViaCep;

        if (dados.erro === true || dados.erro === "true") {
          throw new Error("CEP não encontrado.");
        }

        setEndereco((atual) => ({
          ...atual,
          cep: formatarCep(dados.cep ?? cepNormalizado),
          logradouro: dados.logradouro?.trim() || atual.logradouro,
          complemento: dados.complemento?.trim() || atual.complemento,
          bairro: dados.bairro?.trim() || atual.bairro,
          cidade: dados.localidade?.trim() || atual.cidade,
          uf: dados.uf?.trim().toUpperCase() || atual.uf,
        }));
        setStatusCep({ tipo: "sucesso", mensagem: "Endereço preenchido pelo CEP." });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setStatusCep({
          tipo: "erro",
          mensagem: "Não encontrei esse CEP. Confira os números ou preencha manualmente.",
        });
      });

    return () => controller.abort();
  }, [cepNormalizado]);

  useEffect(() => {
    if (!endereco.uf) return;

    const uf = endereco.uf;
    const controller = new AbortController();

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao consultar cidades.");

        const dados = (await response.json()) as RespostaMunicipioIbge[];

        setCidadesDaUf({
          uf,
          cidades: dados.map((municipio) => municipio.nome),
          status: "sucesso",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setCidadesDaUf({
          uf,
          cidades: [],
          status: "erro",
          mensagem: "Não consegui carregar as cidades dessa UF. Tente novamente.",
        });
      });

    return () => controller.abort();
  }, [endereco.uf]);

  const cidadesCarregando = Boolean(endereco.uf) && cidadesDaUf?.uf !== endereco.uf;
  const cidades = cidadesDaUf?.uf === endereco.uf ? cidadesDaUf.cidades : [];
  const erroCidades = cidadesDaUf?.uf === endereco.uf ? cidadesDaUf.mensagem : undefined;

  function atualizarEndereco(campo: keyof CamposEnderecoCliente, value: string) {
    const valor = campo === "cep" ? formatarCep(value) : value;

    setEndereco((atual) => ({ ...atual, [campo]: valor }));

    if (campo === "cep" && normalizarCep(valor).length < 8) {
      setStatusCep({ tipo: "inicial" });
    } else if (campo === "cep" && normalizarCep(valor).length === 8) {
      setStatusCep({ tipo: "carregando", mensagem: "Buscando endereço pelo CEP..." });
    }
  }

  return (
    <section className="grid min-w-0 gap-4 border-t border-border/70 pt-4">
      <input name="endereco" type="hidden" value={enderecoComposto} />

      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-roxo">Endereço</h3>
        <p className="text-xs text-muted">Insira o CEP.</p>
      </div>

      <div className="grid gap-4">
        <CampoEnderecoTexto
          id="cep"
          inputMode="numeric"
          label="CEP"
          maxLength={9}
          onChange={atualizarEndereco}
          placeholder="00000-000"
          value={endereco.cep}
        />
      </div>

      {cepCompleto ? (
        <>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_8rem]">
            <CampoEnderecoTexto
              id="logradouro"
              label="Rua / logradouro"
              onChange={atualizarEndereco}
              placeholder="Ex.: Rua das Flores"
              value={endereco.logradouro}
            />
            <CampoEnderecoTexto
              id="numero"
              inputMode="numeric"
              label="Número"
              onChange={atualizarEndereco}
              placeholder="Ex.: 120"
              value={endereco.numero}
            />
          </div>

          <CampoEnderecoTexto
            id="complemento"
            label="Complemento"
            onChange={atualizarEndereco}
            placeholder="Ex.: sala 2, bloco B"
            value={endereco.complemento}
          />

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)]">
            <CampoEnderecoTexto
              id="bairro"
              label="Bairro"
              onChange={atualizarEndereco}
              placeholder="Ex.: Centro"
              value={endereco.bairro}
            />
            <div className="grid min-w-0 gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="endereco-uf">
                UF
              </label>
              <select
                className={classeCampo}
                id="endereco-uf"
                name="endereco_uf"
                onChange={(event) => atualizarEndereco("uf", event.target.value)}
                value={endereco.uf}
              >
                <option value="">UF</option>
                {ufsBrasil.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid min-w-0 gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="endereco-cidade">
                Cidade
              </label>
              <select
                className={classeCampo}
                disabled={!endereco.uf || cidadesCarregando}
                id="endereco-cidade"
                name="endereco_cidade"
                onChange={(event) => atualizarEndereco("cidade", event.target.value)}
                value={endereco.cidade}
              >
                <option value="">
                  {endereco.uf ? "Selecione a cidade" : "Selecione a UF primeiro"}
                </option>
                {endereco.cidade && !cidades.includes(endereco.cidade) ? (
                  <option value={endereco.cidade}>{endereco.cidade}</option>
                ) : null}
                {cidades.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
              {erroCidades ? <p className="text-xs text-perigo">{erroCidades}</p> : null}
            </div>
          </div>
        </>
      ) : null}
      {statusCep.mensagem ? (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-xs font-medium",
            statusCep.tipo === "erro" ? "bg-perigo/10 text-perigo" : "bg-brand/10 text-brand",
          )}
          role={statusCep.tipo === "erro" ? "alert" : "status"}
        >
          {statusCep.mensagem}
        </p>
      ) : null}

      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </section>
  );
}

export function FormularioCliente({ cliente }: { cliente?: ClienteFormulario }) {
  const [state, formAction, pending] = useActionState(
    cliente ? atualizarCliente : criarCliente,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      {cliente ? <input name="id" type="hidden" value={cliente.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto
          defaultValue={valorInicial(cliente?.nome)}
          error={state?.campos?.nome}
          label="Nome completo"
          name="nome"
          placeholder="Ex.: Thalia Eluan"
          required
        />
        <CampoDataCalendario
          defaultValue={formatarDataInput(cliente?.dataNascimento)}
          error={state?.campos?.dataNascimento}
          label="Data de nascimento"
          name="dataNascimento"
          required
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.telefone)}
          error={state?.campos?.telefone}
          inputMode="tel"
          label="Telefone"
          name="telefone"
          placeholder="Ex.: (21) 99928-1504"
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.email)}
          error={state?.campos?.email}
          label="E-mail"
          name="email"
          placeholder="Ex.: cliente@email.com"
          type="email"
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.profissao)}
          error={state?.campos?.profissao}
          label="Profissão"
          name="profissao"
          placeholder="Ex.: Designer"
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.contatoEmergenciaTelefone)}
          error={state?.campos?.contatoEmergenciaTelefone}
          inputMode="tel"
          label="Telefone de emergência"
          name="contatoEmergenciaTelefone"
          placeholder="Ex.: (21) 99999-9999"
        />
      </div>

      <CampoTexto
        defaultValue={valorInicial(cliente?.contatoEmergenciaNome)}
        error={state?.campos?.contatoEmergenciaNome}
        label="Contato de emergência"
        name="contatoEmergenciaNome"
        placeholder="Ex.: Maria Eluan (mãe)"
      />
      <CampoEndereco
        defaultValue={valorInicial(cliente?.endereco)}
        error={state?.campos?.endereco}
      />
      <CampoArea
        defaultValue={valorInicial(cliente?.objetivoTratamento)}
        error={state?.campos?.objetivoTratamento}
        label="Objetivo do tratamento"
        name="objetivoTratamento"
        placeholder="Ex.: Redução de medidas e melhora da textura da pele"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <CampoArea
          defaultValue={valorInicial(cliente?.alergias)}
          error={state?.campos?.alergias}
          label="Alergias"
          name="alergias"
          placeholder="Ex.: Nega alergias conhecidas"
        />
        <CampoArea
          defaultValue={valorInicial(cliente?.medicamentos)}
          error={state?.campos?.medicamentos}
          label="Medicamentos em uso"
          name="medicamentos"
          placeholder="Ex.: Anticoncepcional oral"
        />
        <CampoArea
          defaultValue={valorInicial(cliente?.condicoesSaude)}
          error={state?.campos?.condicoesSaude}
          label="Condições de saúde"
          name="condicoesSaude"
          placeholder="Ex.: Sem comorbidades relatadas"
        />
        <CampoArea
          defaultValue={valorInicial(cliente?.cirurgias)}
          error={state?.campos?.cirurgias}
          label="Cirurgias"
          name="cirurgias"
          placeholder="Ex.: Cesárea em 2020"
        />
      </div>

      <CampoArea
        defaultValue={valorInicial(cliente?.contraindicacoes)}
        error={state?.campos?.contraindicacoes}
        label="Contraindicações"
        name="contraindicacoes"
        placeholder="Ex.: Evitar radiofrequência em região com sensibilidade"
      />
      <CampoArea
        defaultValue={valorInicial(cliente?.observacoesInternas)}
        error={state?.campos?.observacoesInternas}
        label="Observações internas"
        name="observacoesInternas"
        placeholder="Anotações apenas para a equipe, não visíveis ao cliente"
      />

      <div className="grid gap-3 rounded-xl bg-creme p-4">
        <CampoCheckbox
          defaultChecked={cliente?.consentimentoDados}
          error={state?.campos?.consentimentoDados}
          label="Cliente consentiu com o uso dos dados para atendimento e acompanhamento."
          name="consentimentoDados"
          required
        />
        <CampoCheckbox
          defaultChecked={cliente?.consentimentoImagem}
          error={state?.campos?.consentimentoImagem}
          label="Cliente consentiu com uso de imagem quando aplicável."
          name="consentimentoImagem"
        />
      </div>

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" />
          )}
          {cliente ? "Atualizar cliente" : "Salvar cliente"}
        </button>
      </div>
    </form>
  );
}
