"use client";

import { useActionState, useRef } from "react";
import { uploadCommunityAvatar } from "@/lib/actions/communities";
import type { UploadState } from "@/lib/actions/media";

const initialState: UploadState = { error: null };

export function CommunityAvatarUploadForm({ communityId }: { communityId: string }) {
  const [state, formAction, pending] = useActionState(uploadCommunityAvatar, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="mt-1">
      <input type="hidden" name="communityId" value={communityId} />
      <label className="text-xs font-semibold cursor-pointer" style={{ color: "var(--blue)" }}>
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
