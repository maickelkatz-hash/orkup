"use client";

import { useState, useTransition } from "react";
import { resendConfirmation } from "@/lib/actions/auth";

export function ResendButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await resendConfirmation(email);
            setStatus(result.error ? "error" : "sent");
          });
        }}
        className="btn-secondary w-full"
      >
        {pending ? "Enviando..." : "Reenviar e-mail"}
      </button>
      {status === "sent" && (
        <p className="text-sm mt-2" style={{ color: "var(--green)" }}>
          E-mail reenviado!
        </p>
      )}
      {status === "error" && (
        <p className="text-sm mt-2" style={{ color: "var(--danger)" }}>
          Não foi possível reenviar agora. Tente de novo em instantes.
        </p>
      )}
    </div>
  );
}
