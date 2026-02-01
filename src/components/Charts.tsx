import { createEffect, createSignal, onCleanup } from "solid-js";
import * as echarts from "echarts";
import type { Transaction } from "../lib/supabase";

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export function SummaryPieChart(props: Props) {
  const [el, setEl] = createSignal<HTMLDivElement | undefined>();

  createEffect(() => {
    const div = el();
    if (!div) return;
    const chart = echarts.init(div);
    onCleanup(() => chart.dispose());
    createEffect(() => {
      const list = props.transactions;
      const income = list.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      chart.setOption({
        tooltip: { trigger: "item", formatter: "{b}: {c} บาท" },
        legend: { bottom: 0, textStyle: { color: "#a1a1aa" } },
        color: ["#22c55e", "#ef4444"],
        series: [
          {
            type: "pie",
            radius: "60%",
            center: ["50%", "45%"],
            data: [
              { value: income, name: "รายรับ" },
              { value: expense, name: "รายจ่าย" },
            ],
            label: { color: "#f4f4f5", formatter: "{b}\n{c} บาท" },
          },
        ],
      });
    });
  });

  return (
    <div class="bg-[var(--card)] rounded-2xl p-4 border border-white/5">
      <h3 class="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-2">สรุป รายรับ vs รายจ่าย</h3>
      <div ref={setEl} class="h-56 w-full" />
    </div>
  );
}

export function CategoryBarChart(props: Props) {
  const [el, setEl] = createSignal<HTMLDivElement | undefined>();

  createEffect(() => {
    const div = el();
    if (!div) return;
    const chart = echarts.init(div);
    onCleanup(() => chart.dispose());
    createEffect(() => {
      const list = props.transactions;
      const byCategory: Record<string, { income: number; expense: number }> = {};
      for (const t of list) {
        const cat = t.category || "—";
        if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
        if (t.type === "income") byCategory[cat].income += Number(t.amount);
        else byCategory[cat].expense += Number(t.amount);
      }
      const categories = Object.keys(byCategory).slice(0, 10);
      chart.setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { bottom: 0, textStyle: { color: "#a1a1aa" } },
        grid: { left: "3%", right: "4%", bottom: "15%", top: "8%", containLabel: true },
        xAxis: { type: "category", data: categories, axisLabel: { color: "#a1a1aa" } },
        yAxis: { type: "value", axisLabel: { color: "#a1a1aa" }, splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } } },
        color: ["#22c55e", "#ef4444"],
        series: [
          { name: "รายรับ", type: "bar", data: categories.map((c) => byCategory[c].income) },
          { name: "รายจ่าย", type: "bar", data: categories.map((c) => byCategory[c].expense) },
        ],
      });
    });
  });

  return (
    <div class="bg-[var(--card)] rounded-2xl p-4 border border-white/5">
      <h3 class="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-2">สรุปตามหมวดหมู่</h3>
      <div ref={setEl} class="h-56 w-full" />
    </div>
  );
}
