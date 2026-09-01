import { createDepoimento, respondDepoimento, deleteDepoimento } from "@/lib/actions/depoimentos";
import { Avatar } from "@/components/Avatar";

export type Depoimento = {
  id: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  author: { id: string; username: string; display_name: string; initials: string; avatar_url: string | null };
};

export function DepoimentosSection({
  profileId,
  isMe,
  canWrite,
  alreadyWrote,
  approved,
  pending,
}: {
  profileId: string;
  isMe: boolean;
  canWrite: boolean;
  alreadyWrote: boolean;
  approved: Depoimento[];
  pending: Depoimento[];
}) {
  return (
    <div className="card p-6 mb-4">
      <h2 className="font-bold mb-3">Depoimentos</h2>

      {canWrite && !alreadyWrote && (
        <form action={createDepoimento} className="mb-4">
          <input type="hidden" name="profileId" value={profileId} />
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            className="input-field"
            placeholder="Escreva um depoimento — fica pendente até a pessoa aprovar."
          />
          <button type="submit" className="btn-primary mt-2">
            Enviar depoimento
          </button>
        </form>
      )}

      {isMe && pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Aguardando sua aprovação ({pending.length})
          </p>
          <ul className="space-y-3">
            {pending.map((dep) => (
              <li key={dep.id} className="p-3 rounded" style={{ background: "var(--blue-lighter)" }}>
                <p className="text-sm">
                  <span className="font-semibold">{dep.author.display_name}</span>
                </p>
                <p className="text-sm mb-2">{dep.body}</p>
                <div className="flex gap-2">
                  <form action={respondDepoimento}>
                    <input type="hidden" name="depoimentoId" value={dep.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button type="submit" className="btn-primary text-xs px-3 py-1">
                      Aprovar
                    </button>
                  </form>
                  <form action={respondDepoimento}>
                    <input type="hidden" name="depoimentoId" value={dep.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button type="submit" className="btn-secondary text-xs px-3 py-1">
                      Recusar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {approved.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Nenhum depoimento aprovado ainda.
        </p>
      )}

      <ul className="space-y-3">
        {approved.map((dep) => (
          <li key={dep.id} className="flex gap-3">
            <Avatar avatarUrl={dep.author.avatar_url} initials={dep.author.initials} size={32} />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{dep.author.display_name}</span>{" "}
                <span style={{ color: "var(--muted)" }}>@{dep.author.username}</span>
              </p>
              <p className="text-sm">{dep.body}</p>
              {isMe && (
                <form action={deleteDepoimento}>
                  <input type="hidden" name="depoimentoId" value={dep.id} />
                  <button type="submit" className="text-xs" style={{ color: "var(--muted)" }}>
                    remover
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
