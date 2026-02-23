interface Props {
  name: string;
  color: string;
}

export function StatusPill({ name, color }: Props) {
  const lowercaseName = name.toLowerCase();

  let backgroundColor = color;
  const textColor = "white";

  if (lowercaseName.includes("hecho") || lowercaseName.includes("completado") || lowercaseName.includes("done")) {
    backgroundColor = "hsl(var(--monday-done))";
  } else if (lowercaseName.includes("proceso") || lowercaseName.includes("working")) {
    backgroundColor = "hsl(var(--monday-working))";
  } else if (lowercaseName.includes("atascado") || lowercaseName.includes("stuck")) {
    backgroundColor = "hsl(var(--monday-stuck))";
  } else if (lowercaseName.includes("espera") || lowercaseName.includes("waiting")) {
    backgroundColor = "hsl(var(--monday-waiting))";
  } else if (lowercaseName.includes("pendiente") || lowercaseName.includes("todo")) {
    backgroundColor = "#c4c4c4";
  }

  return (
    <div
      className="w-full h-full min-h-[32px] flex items-center justify-center px-2 py-1 text-[13px] font-semibold text-center leading-tight transition-opacity hover:opacity-90"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {name}
    </div>
  );
}
