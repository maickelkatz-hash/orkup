export function Avatar({
  avatarUrl,
  initials,
  size = 40,
}: {
  avatarUrl: string | null | undefined;
  initials: string | null | undefined;
  size?: number;
}) {
  const dimension = `${size}px`;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- conteúdo do usuário, sem otimização estática
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: dimension,
        height: dimension,
        background: "var(--blue)",
        fontSize: size <= 32 ? "0.7rem" : "0.9rem",
      }}
    >
      {initials || "?"}
    </div>
  );
}
