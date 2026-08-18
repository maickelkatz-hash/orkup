"use client";

import { useRef } from "react";
import { deleteCommunity } from "@/lib/actions/communities";

export function DeleteCommunityButton({ communityId }: { communityId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={deleteCommunity}>
      <input type="hidden" name="communityId" value={communityId} />
      <button
        type="button"
        className="text-xs"
        style={{ color: "var(--danger)" }}
        onClick={() => {
          if (
            window.confirm(
              "Encerrar esta comunidade? Todos os tópicos e respostas dela serão apagados. Isso não pode ser desfeito."
            )
          ) {
            formRef.current?.requestSubmit();
          }
        }}
      >
        Encerrar comunidade
      </button>
    </form>
  );
}
