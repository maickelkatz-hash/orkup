import { createRecado, deleteRecado } from "@/lib/actions/recados";
import { Avatar } from "@/components/Avatar";

export type Recado = {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; username: string; display_name: string; initials: string; avatar_url: string | null };
};

export function RecadosSection({
  profileId,
  meId,
  isMe,
  canPost,
  recados,
}: {
  profileId: string;
  meId: string;
  isMe: boolean;
  canPost: boolean;
  recados: Recado[];
}) {
  return (
    <div className="card p-6 mb-4">
      <h2 className="font-bold mb-3">Recados</h2>

      {canPost && (
        <form action={createRecado} className="mb-4">
          <input type="hidden" name="profileId" value={profileId} />
          <textarea
            name="body"
            required
            maxLength={500}
            rows={2}
            className="input-field"
            placeholder={isMe ? "Escreva algo no seu próprio mural..." : "Deixe um recado..."}
          />
          <button type="submit" className="btn-primary mt-2">
            Publicar recado
          </button>
        </form>
      )}

      {recados.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {canPost ? "Nenhum recado ainda — seja o primeiro." : "Nenhum recado ainda."}
        </p>
      )}

      <ul className="space-y-3">
        {recados.map((recado) => (
          <li key={recado.id} className="flex gap-3">
            <Avatar avatarUrl={recado.author.avatar_url} initials={recado.author.initials} size={32} />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{recado.author.display_name}</span>{" "}
                <span style={{ color: "var(--muted)" }}>@{recado.author.username}</span>
              </p>
              <p className="text-sm">{recado.body}</p>
              {(recado.author.id === meId || isMe) && (
                <form action={deleteRecado}>
                  <input type="hidden" name="recadoId" value={recado.id} />
                  <button type="submit" className="text-xs" style={{ color: "var(--muted)" }}>
                    apagar
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
