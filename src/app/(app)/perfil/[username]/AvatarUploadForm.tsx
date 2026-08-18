"use client";

import { useActionState, useRef } from "react";
import { uploadAvatar, type UploadState } from "@/lib/actions/media";

const initialState: UploadState = { error: null };

export function AvatarUploadForm() {
  const [state, formAction, pending] = useActionState(uploadAvatar, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-2"
    >
      <label
        className="text-xs font-semibold cursor-pointer"
        style={{ color: "var(--blue)" }}
      >
        {pending ? "Enviando..." : "Trocar foto"}
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      {state.error && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
