"use client";

import { useState } from "react";
import { updateProfileDetails } from "@/lib/actions/profile-details";

type ProfileDetails = {
  bio: string | null;
  quem_sou: string | null;
  birth_date: string | null;
  relationship_status: string | null;
  platform_interest: string | null;
  has_children: string | null;
  sexual_orientation: string | null;
  smokes: boolean | null;
  activities: string | null;
  books: string | null;
  music: string | null;
  occupation: string | null;
  employer: string | null;
  education: string | null;
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  solteiro: "Solteiro(a)",
  namorando: "Namorando",
  noivo: "Noivo(a)",
  casado: "Casado(a)",
  e_complicado: "É complicado",
  aberto_relacionamento: "Relacionamento aberto",
};

const INTEREST_LABELS: Record<string, string> = {
  fazer_amigos: "Fazer amigos",
  namorar: "Namorar",
  trabalho: "Contatos de trabalho",
  comunidades: "Participar de comunidades",
};

const ORIENTATION_LABELS: Record<string, string> = {
  heterossexual: "Heterossexual",
  homossexual: "Homossexual",
  bissexual: "Bissexual",
  assexual: "Assexual",
  outro: "Outro",
  prefiro_nao_dizer: "Prefiro não dizer",
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 text-sm border-b" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{label}:</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function SobreSection({
  isMe,
  details,
}: {
  profileId: string;
  isMe: boolean;
  details: ProfileDetails;
}) {
  const [tab, setTab] = useState<"social" | "profissional" | "pessoal">("social");
  const [editing, setEditing] = useState(false);

  const hasAnyDetail =
    details.quem_sou ||
    details.birth_date ||
    details.relationship_status ||
    details.platform_interest ||
    details.has_children ||
    details.sexual_orientation ||
    details.smokes !== null ||
    details.activities ||
    details.books ||
    details.music ||
    details.occupation ||
    details.employer ||
    details.education;

  if (editing && isMe) {
    return (
      <div className="card p-6 mb-4">
        <h2 className="font-bold mb-3">Editar perfil</h2>
        <form
          action={async (formData) => {
            await updateProfileDetails(formData);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Quem sou
            </label>
            <textarea
              name="quem_sou"
              defaultValue={details.quem_sou ?? ""}
              maxLength={2000}
              rows={3}
              className="input-field mt-1"
              placeholder="Fale um pouco sobre você..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Data de nascimento
            </label>
            <input
              type="date"
              name="birth_date"
              defaultValue={details.birth_date ?? ""}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Relação
            </label>
            <select name="relationship_status" defaultValue={details.relationship_status ?? ""} className="input-field mt-1">
              <option value="">Não informado</option>
              {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Interesses no OrkUp
            </label>
            <select name="platform_interest" defaultValue={details.platform_interest ?? ""} className="input-field mt-1">
              <option value="">Não informado</option>
              {Object.entries(INTEREST_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                Filhos
              </label>
              <select name="has_children" defaultValue={details.has_children ?? ""} className="input-field mt-1">
                <option value="">Não informado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                Fuma
              </label>
              <select
                name="smokes"
                defaultValue={details.smokes === null ? "" : details.smokes ? "sim" : "nao"}
                className="input-field mt-1"
              >
                <option value="">Não informado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Orientação sexual
            </label>
            <select name="sexual_orientation" defaultValue={details.sexual_orientation ?? ""} className="input-field mt-1">
              <option value="">Prefiro não informar</option>
              {Object.entries(ORIENTATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Atividades
            </label>
            <input
              type="text"
              name="activities"
              defaultValue={details.activities ?? ""}
              maxLength={500}
              className="input-field mt-1"
              placeholder="Ex: leitura em dias chuvosos, séries..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Livros
            </label>
            <input
              type="text"
              name="books"
              defaultValue={details.books ?? ""}
              maxLength={500}
              className="input-field mt-1"
          />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Música
            </label>
            <input
              type="text"
              name="music"
              defaultValue={details.music ?? ""}
              maxLength={500}
              className="input-field mt-1"
          />
          </div>

          <hr style={{ borderColor: "var(--border)" }} />

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Ocupação
            </label>
            <input
              type="text"
              name="occupation"
              defaultValue={details.occupation ?? ""}
              maxLength={200}
              className="input-field mt-1"
          />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Empresa
            </label>
            <input
              type="text"
              name="employer"
              defaultValue={details.employer ?? ""}
              maxLength={200}
              className="input-field mt-1"
          />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Formação
            </label>
            <input
              type="text"
              name="education"
              defaultValue={details.education ?? ""}
              maxLength={500}
              className="input-field mt-1"
          />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">
              Salvar
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">Sobre</h2>
        {isMe && (
          <button onClick={() => setEditing(true)} className="text-xs font-semibold" style={{ color: "var(--blue)" }}>
            editar
          </button>
        )}
      </div>

      {details.quem_sou && (
        <p className="text-sm mb-4" style={{ color: "var(--text)" }}>
          {details.quem_sou}
        </p>
      )}

      <div className="flex gap-1 mb-3 border-b" style={{ borderColor: "var(--border)" }}>
        {(["social", "profissional", "pessoal"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 text-sm font-semibold capitalize"
            style={{
              color: tab === t ? "var(--blue)" : "var(--muted)",
              borderBottom: tab === t ? "2px solid var(--blue)" : "2px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {!hasAnyDetail && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {isMe ? "Você ainda não preencheu essas informações." : "Nada preenchido ainda."}
        </p>
      )}

      {tab === "social" && (
        <div>
          <Row label="Data de nascimento" value={details.birth_date} />
          <Row label="Relação" value={details.relationship_status ? RELATIONSHIP_LABELS[details.relationship_status] : null} />
          <Row label="Interesses no OrkUp" value={details.platform_interest ? INTEREST_LABELS[details.platform_interest] : null} />
        </div>
      )}

      {tab === "profissional" && (
        <div>
          <Row label="Ocupação" value={details.occupation} />
          <Row label="Empresa" value={details.employer} />
          <Row label="Formação" value={details.education} />
        </div>
      )}

      {tab === "pessoal" && (
        <div>
          <Row label="Filhos" value={details.has_children === "sim" ? "Sim" : details.has_children === "nao" ? "Não" : null} />
          <Row label="Orientação sexual" value={details.sexual_orientation ? ORIENTATION_LABELS[details.sexual_orientation] : null} />
          <Row label="Fuma" value={details.smokes === null ? null : details.smokes ? "Sim" : "Não"} />
          <Row label="Atividades" value={details.activities} />
          <Row label="Livros" value={details.books} />
          <Row label="Música" value={details.music} />
        </div>
      )}
    </div>
  );
}
