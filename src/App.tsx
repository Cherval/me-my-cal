import { createSignal, onMount, Show } from "solid-js";
import { supabase } from "./lib/supabase";
import type { Transaction, TransactionType } from "./lib/supabase";
import Summary from "./components/Summary";
import AddForm from "./components/AddForm";
import TransactionTable from "./components/TransactionTable";
import { SummaryPieChart, CategoryBarChart } from "./components/Charts";
import Login from "./components/Login";
import TransactionsPage from "./components/TransactionsPage";

const DEMO_STORAGE_KEY = "me-my-cal-demo-transactions";

function loadDemoTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Transaction[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveDemoTransactions(list: Transaction[]) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
}

export default function App() {
  const [transactions, setTransactions] = createSignal<Transaction[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [authReady, setAuthReady] = createSignal(false);
  const [demoMode, setDemoMode] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [addError, setAddError] = createSignal<string | null>(null);
  const [fetchError, setFetchError] = createSignal<string | null>(null);

  // New State
  const [view, setView] = createSignal<"dashboard" | "table">("dashboard");
  const [filterMode, setFilterMode] = createSignal<"all" | "month" | "range">("all");
  const [filterMonth, setFilterMonth] = createSignal(new Date().toISOString().slice(0, 7));
  const [filterStart, setFilterStart] = createSignal("");
  const [filterEnd, setFilterEnd] = createSignal("");

  onMount(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !demoMode()) {
        setAuthReady(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthReady(true);
        fetchTransactions();
        subscribe();
        setLoading(false);
        return;
      }
      setLoading(false);
    });
  });

  function useDemoMode() {
    setDemoMode(true);
    setLoading(true);
    const list = loadDemoTransactions().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setTransactions(list);
    setLoading(false);
  }

  function onLoginSuccess() {
    setAuthReady(true);
    fetchTransactions();
    subscribe();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthReady(false);
    setTransactions([]);
  }

  function fetchTransactions() {
    if (demoMode()) {
      setTransactions(
        loadDemoTransactions().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      return;
    }
    setLoading(true);
    setFetchError(null);
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error(error);
          setFetchError(error.message);
          setTransactions([]);
          return;
        }
        setTransactions((data as Transaction[]) ?? []);
      });
  }

  function subscribe() {
    if (demoMode()) return;
    supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchTransactions()
      )
      .subscribe();
  }

  async function addTransaction(entry: {
    type: TransactionType;
    amount: number;
    category: string;
    note: string;
    emoji: string;
    method: string;
    bank: string;
    party: string;
    item: string;
    location: string;
  }) {
    if (demoMode()) {
      const list = loadDemoTransactions();
      const newRow: Transaction = {
        id: crypto.randomUUID(),
        user_id: "demo",
        type: entry.type,
        amount: entry.amount,
        category: entry.category || "",
        note: entry.note || null,
        emoji: entry.emoji || null,
        created_at: new Date().toISOString(),
        method: entry.method || null,
        bank: entry.bank || null,
        party: entry.party || null,
        item: entry.item || null,
        location: entry.location || null,
      };
      list.unshift(newRow);
      saveDemoTransactions(list);
      setTransactions([...list]);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAddError("ไม่ได้ล็อกอิน");
      return;
    }
    setAddError(null);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: entry.type,
      amount: entry.amount,
      category: entry.category || null,
      note: entry.note || null,
      emoji: entry.emoji || null,
      method: entry.method || null,
      bank: entry.bank || null,
      party: entry.party || null,
      item: entry.item || null,
      location: entry.location || null,
    });
    if (error) {
      setAddError(error.message);
      return;
    }
    fetchTransactions();
  }

  async function deleteTransaction(id: string) {
    setDeleteError(null);
    if (demoMode()) {
      const list = loadDemoTransactions().filter((t) => t.id !== id);
      saveDemoTransactions(list);
      setTransactions([...list]);
      return;
    }
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    fetchTransactions();
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    if (demoMode()) {
       const list = loadDemoTransactions().map(t => t.id === id ? { ...t, ...updates } : t);
       if (updates.created_at) list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
       saveDemoTransactions(list);
       setTransactions(list);
       return;
    }
    const { error } = await supabase.from("transactions").update(updates).eq("id", id);
    if (error) {
        alert("บันทึกไม่สำเร็จ: " + error.message);
        return;
    }
    fetchTransactions();
  }

  const visibleTransactions = () => {
     const list = transactions();
     console.log("All transactions:", list);
     console.log("Filter mode:", filterMode(), "Filter month:", filterMonth());
     
     if (filterMode() === "all") return list;
     if (filterMode() === "month") {
        const [year, month] = filterMonth().split('-').map(Number);
        return list.filter(t => {
            if (!t.created_at) return true; // Show if no date
            const d = new Date(t.created_at);
            if (isNaN(d.getTime())) return true; // Show if invalid date
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        });
     }
     if (filterMode() === "range") {
         if (!filterStart() || !filterEnd()) return list;
         const startDate = new Date(filterStart());
         const endDate = new Date(filterEnd());
         endDate.setHours(23, 59, 59, 999);
         return list.filter(t => {
             if (!t.created_at) return true;
             const d = new Date(t.created_at);
             if (isNaN(d.getTime())) return true;
             return d >= startDate && d <= endDate;
         });
     }
     return list;
  };

  const income = () =>
    visibleTransactions().filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = () =>
    visibleTransactions().filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = () => income() - expense();

  return (
    <div class="min-h-screen pb-24">
      <header class="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur border-b border-white/5 px-4 py-3 gap-2 flex flex-col md:flex-row md:items-center">
        <h1 class="text-lg font-semibold flex items-center gap-2">
            <span>บันทึกรายรับรายจ่าย</span>
        </h1>
        
        {/* Navigation - only show when logged in */}
        <Show when={authReady() || demoMode()}>
        <div class="flex bg-white/5 p-1 rounded-lg">
            <button 
                class={`px-3 py-1 text-sm rounded-md transition ${view() === 'dashboard' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-white'}`}
                onClick={() => setView('dashboard')}
            >
                ภาพรวม
            </button>
            <button 
                class={`px-3 py-1 text-sm rounded-md transition ${view() === 'table' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-white'}`}
                onClick={() => setView('table')}
            >
                ตารางข้อมูล
            </button>
        </div>
        </Show>

        <div class="flex-1" />

        <Show when={authReady() || demoMode()}>
        <div class="flex flex-wrap gap-2 items-center">
            {/* Filter Controls */}
             <select 
                class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                value={filterMode()}
                onInput={(e) => setFilterMode((e.target as HTMLSelectElement).value as any)}
            >
                <option value="month" class="bg-[var(--card)]">รายเดือน</option>
                <option value="range" class="bg-[var(--card)]">กำหนดเอง</option>
                <option value="all" class="bg-[var(--card)]">ทั้งหมด</option>
            </select>

            <Show when={filterMode() === 'month'}>
                <input 
                    type="month" 
                    class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                    value={filterMonth()} 
                    onInput={(e) => setFilterMonth((e.target as HTMLInputElement).value)}
                />
            </Show>
            <Show when={filterMode() === 'range'}>
                <input 
                    type="date" 
                    class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                    value={filterStart()} 
                    onInput={(e) => setFilterStart((e.target as HTMLInputElement).value)}
                />
                <span class="text-[var(--muted)]">-</span>
                <input 
                    type="date" 
                    class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                    value={filterEnd()} 
                    onInput={(e) => setFilterEnd((e.target as HTMLInputElement).value)}
                />
            </Show>

            <Show when={authReady() && !demoMode()}>
            <button
                type="button"
                class="text-sm text-[var(--muted)] hover:text-white shrink-0 ml-2"
                onClick={signOut}
            >
                ออกจากระบบ
            </button>
            </Show>
        </div>
        </Show>
      </header>

      <Show when={!authReady() && !demoMode()}>
        <Login onSuccess={onLoginSuccess} onUseDemo={useDemoMode} />
      </Show>

      <Show when={authReady() || demoMode()}>
        <main class="px-4 pt-6 max-w-6xl mx-auto">
          <Show when={fetchError()}>
            <p class="text-amber-400 text-sm mb-2">โหลดรายการไม่สำเร็จ: {fetchError()}</p>
          </Show>
          <Show when={addError()}>
            <p class="text-red-400 text-sm mb-2">บันทึกไม่สำเร็จ: {addError()}</p>
          </Show>
          <Show when={deleteError()}>
            <p class="text-red-400 text-sm mb-2">ลบไม่สำเร็จ: {deleteError()}</p>
          </Show>

          <Show when={view() === 'dashboard'}>
            {/* Desktop: ซ้าย = สรุป + ฟอร์ม, ขวา = ตาราง + กราฟ */}
            <div class="grid lg:grid-cols-[380px_1fr] gap-6 lg:gap-8">
                {/* คอลัมน์ซ้าย: ฟังก์ชันบันทึก */}
                <aside class="space-y-6 lg:sticky lg:top-16 lg:self-start">
                <Summary income={income()} expense={expense()} balance={balance()} loading={loading()} />
                <AddForm onAdd={addTransaction} />
                </aside>

                {/* คอลัมน์ขวา: ตารางรายรับ / รายจ่าย + กราฟ */}
                <div class="space-y-6">
                 <div class="grid md:grid-cols-2 gap-4">
                    <SummaryPieChart transactions={visibleTransactions()} loading={loading()} />
                    <CategoryBarChart transactions={visibleTransactions()} loading={loading()} />
                 </div>
                 <div class="space-y-4">
                    <TransactionTable
                    transactions={visibleTransactions()}
                    type="income"
                    loading={loading()}
                    onDelete={deleteTransaction}
                    limit={10}
                    />
                    <TransactionTable
                    transactions={visibleTransactions()}
                    type="expense"
                    loading={loading()}
                    onDelete={deleteTransaction}
                    limit={10}
                    />
                </div>
                </div>
            </div>
          </Show>

          <Show when={view() === 'table'}>
              <TransactionsPage 
                transactions={visibleTransactions()} 
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
              />
          </Show>
        </main>
      </Show>

      <Show when={demoMode()}>
        <p class="text-center text-xs text-[var(--muted)] py-2">โหมด Demo — ข้อมูลเก็บในเครื่องเท่านั้น</p>
      </Show>
    </div>
  );
}
