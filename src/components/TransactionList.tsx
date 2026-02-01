import { For, Show } from "solid-js";
import type { Transaction } from "../lib/supabase";

interface Props {
  transactions: Transaction[];
  loading: boolean;
  onDelete: (id: string) => void;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  ) {
    return "วันนี้ " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionList(props: Props) {
  return (
    <section>
      <h2 class="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
        รายการล่าสุด
      </h2>
      <Show
        when={!props.loading}
        fallback={
          <div class="space-y-2">
            {[1, 2, 3].map(() => (
              <div class="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        }
      >
        <Show
          when={props.transactions.length > 0}
          fallback={
            <p class="text-[var(--muted)] text-center py-8">ยังไม่มีรายการ — เพิ่มรายการแรกด้านบน</p>
          }
        >
          <ul class="space-y-2">
            <For each={props.transactions}>
              {(t) => (
                <li class="flex items-center gap-3 bg-[var(--card)] rounded-xl p-3 border border-white/5">
                  <span class="emoji-native text-2xl w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg">
                    {t.emoji || "📌"}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{t.category || "—"}</p>
                    <p class="text-xs text-[var(--muted)]">{formatDate(t.created_at)}</p>
                  </div>
                  <p
                    class={`amount-display text-xl font-bold shrink-0 ${
                      t.type === "income" ? "text-[var(--income)]" : "text-[var(--expense)]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatMoney(Number(t.amount))}
                  </p>
                  <button
                    type="button"
                    class="p-2 rounded-lg text-[var(--muted)] hover:bg-white/10 hover:text-red-400 transition"
                    onClick={() => props.onDelete(t.id)}
                    aria-label="ลบ"
                  >
                    🗑️
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </section>
  );
}
