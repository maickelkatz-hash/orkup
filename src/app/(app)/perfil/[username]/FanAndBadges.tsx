"use client";

import { becomeFan, removeFan } from "@/lib/actions/fans";
import { toggleBadge } from "@/lib/actions/badges";

const BADGE_META: Record<string, { label: string; emoji: string }> = {
  fiel: { label: "fiel", emoji: "🛡️" },
  legal: { label: "legal", emoji: "😎" },
  sexy: { label: "sexy", emoji: "❤️" },
};

export function FanAndBadges({
  profileId,
  isMe,
  fanCount,
  isFan,
  badgeCounts,
  myVotes,
}: {
  profileId: string;
  isMe: boolean;
  fanCount: number;
  isFan: boolean;
  badgeCounts: Record<string, number>;
  myVotes: Set<string>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--muted)" }}>
          ⭐ {fanCount} fã{fanCount === 1 ? "" : "s"}
        </span>
        {!isMe && (
          <form action={isFan ? removeFan : becomeFan}>
            <input type="hidden" name="targetId" value={profileId} />
            <button type="submit" className="text-xs font-semibold" style={{ color: "var(--blue)" }}>
              {isFan ? "deixar de ser fã" : "tornar-se fã"}
            </button>
          </form>
        )}
      </div>

      <div className="flex items-center gap-2">
        {Object.entries(BADGE_META).map(([type, meta]) => {
          const voted = myVotes.has(type);
          return (
            <form action={isMe ? undefined : toggleBadge} key={type}>
              <input type="hidden" name="profileId" value={profileId} />
              <input type="hidden" name="badgeType" value={type} />
              <button
                type="submit"
                disabled={isMe}
                title={isMe ? undefined : voted ? `Remover voto "${meta.label}"` : `Achar este perfil "${meta.label}"`}
                className="px-2 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: voted ? "var(--blue-lighter)" : "transparent",
                  border: "1px solid var(--border)",
                  color: voted ? "var(--blue)" : "var(--muted)",
                  cursor: isMe ? "default" : "pointer",
                }}
              >
                {meta.emoji} {meta.label} {badgeCounts[type] ?? 0}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
