import { For, Show, createSignal } from "solid-js";
import type { Transaction } from "../lib/supabase";

interface Props {
  transactions: Transaction[];
  type: "income" | "expense";
  loading: boolean;
  onDelete: (id: string) => void;
  limit?: number;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionTable(props: Props) {
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [deleteId, setDeleteId] = createSignal<string | null>(null);

  const confirmDelete = () => {
    if (deleteId()) {
      props.onDelete(deleteId()!);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const title = props.type === "income" ? "รายรับ" : "รายจ่าย";
  const list = () => {
    const filtered = props.transactions
      .filter((t) => t.type === props.type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return props.limit ? filtered.slice(0, props.limit) : filtered;
  };

  return (
    <>
    <div class="bg-[var(--card)] rounded-2xl border border-white/5 overflow-hidden">
      <h2 class="text-sm font-medium text-[var(--muted)] uppercase tracking-wider px-4 py-3 border-b border-white/5">
        {title}
      </h2>
      <Show
        when={!props.loading}
        fallback={
          <div class="p-4 space-y-2">
            {[1, 2, 3, 4].map(() => (
              <div class="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        }
      >
        <Show
          when={list().length > 0}
          fallback={
            <p class="text-[var(--muted)] text-sm text-center py-6">ยังไม่มีรายการ</p>
          }
        >
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-[var(--muted)] border-b border-white/5">
                  <th class="px-4 py-2 font-medium">หมวด / รายการ</th>
                  <th class="px-4 py-2 font-medium">วันที่</th>
                  <th class="px-4 py-2 font-medium">รายละเอียดเพิ่มเติม</th>
                  <th class="px-4 py-2 font-medium text-right">จำนวน (บาท)</th>
                  <th class="w-10 px-2 py-2" aria-label="ลบ" />
                </tr>
              </thead>
              <tbody>
                <For each={list()}>
                  {(t) => (
                    <tr class="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td class="px-4 py-2">
                         <div class="flex items-center gap-2">
                             <span class="emoji-native text-lg">{t.emoji || "📌"}</span>
                             <div>
                                 <div>{t.category || "—"}</div>
                                 <div class="text-xs text-[var(--muted)]">{t.note || t.item || "-"}</div>
                             </div>
                         </div>
                      </td>
                      <td class="px-4 py-2 text-[var(--muted)] align-top">{formatDate(t.created_at)}</td>
                      <td class="px-4 py-2 text-xs text-[var(--muted)] align-top">
                          <Show when={t.bank}>
                            <span class="inline-block px-1.5 py-0.5 rounded mr-1 text-[var(--text)] border border-white/10" style="background: var(--bg)">
                                🏦 {t.bank}
                            </span>
                          </Show>
                          <Show when={t.method}>
                            <span class="inline-block mr-1">💳 {t.method}</span>
                          </Show>
                          <Show when={t.party}>
                            <div class="mt-0.5">👤 {t.party}</div>
                          </Show>
                          <Show when={t.location}>
                             <div class="mt-0.5 truncate max-w-[120px]" title={t.location || ''}>📍 {t.location}</div>
                          </Show>
                      </td>
                      <td
                        class={`px-4 py-2 text-right amount-display font-semibold align-top ${
                          props.type === "income" ? "text-[var(--income)]" : "text-[var(--expense)]"
                        }`}
                      >
                        {props.type === "income" ? "+" : "-"}
                        {formatMoney(Number(t.amount))}
                      </td>
                      <td class="px-2 py-2 align-top">
                        <button
                          type="button"
                          class="p-1.5 rounded text-[var(--muted)] hover:bg-white/10 hover:text-red-400 transition"
                          onClick={() => { setDeleteId(t.id); setShowDeleteModal(true); }}
                          aria-label="ลบ"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
      <Show when={showDeleteModal()}>
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-[var(--card)] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 class="text-lg font-semibold mb-2 text-white">ยืนยันการลบ?</h3>
              <p class="text-[var(--muted)] text-sm mb-6">คุณต้องการลบรายการนี้ใช่หรือไม่?</p>
              <div class="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} class="px-4 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-white hover:bg-white/5 transition">ยกเลิก</button>
                <button onClick={confirmDelete} class="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition">ลบรายการ</button>
              </div>
            </div>
          </div>
        </Show>
    </div>
    </>
  );
}
