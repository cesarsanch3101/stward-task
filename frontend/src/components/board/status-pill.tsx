import { STATUS_BG, STATUS_TEXT } from "@/lib/status-colors";
import type { ColumnStatus } from "@/lib/types";

interface Props {
  name: string;
  status: ColumnStatus;
}

export function StatusPill({ name, status }: Props) {
  return (
    <div
      className="w-full h-full min-h-[32px] flex items-center justify-center px-2 py-1 text-[13px] font-semibold text-center leading-tight transition-opacity hover:opacity-90"
      style={{
        backgroundColor: STATUS_BG[status],
        color: STATUS_TEXT[status],
      }}
    >
      {name}
    </div>
  );
}
