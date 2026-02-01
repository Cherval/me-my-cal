import { Show } from "solid-js";

interface Props {
  income: number;
  expense: number;
  balance: number;
  loading: boolean;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Summary(props: Props) {
  return (
    <div class="grid grid-cols-3 gap-3 mb-8">
      <div class="bg-[var(--card)] rounded-2xl p-4 border border-white/5 text-center">
        <p class="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">รายรับ</p>
        <Show when={!props.loading} fallback={<div class="h-10 bg-white/10 rounded animate-pulse" />}>
          <p class="amount-display text-2xl sm:text-3xl font-bold text-[var(--income)]">
            {formatMoney(props.income)}
          </p>
        </Show>
      </div>
      <div class="bg-[var(--card)] rounded-2xl p-4 border border-white/5 text-center">
        <p class="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">รายจ่าย</p>
        <Show when={!props.loading} fallback={<div class="h-10 bg-white/10 rounded animate-pulse" />}>
          <p class="amount-display text-2xl sm:text-3xl font-bold text-[var(--expense)]">
            {formatMoney(props.expense)}
          </p>
        </Show>
      </div>
      <div class="bg-[var(--card)] rounded-2xl p-4 border border-[var(--accent)]/30 text-center">
        <p class="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">คงเหลือ</p>
        <Show when={!props.loading} fallback={<div class="h-10 bg-white/10 rounded animate-pulse" />}>
          <p class="amount-display text-2xl sm:text-3xl font-bold text-[var(--accent)]">
            {formatMoney(props.balance)}
          </p>
        </Show>
      </div>
    </div>
  );
}
