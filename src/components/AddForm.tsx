import { createSignal, onMount, Show } from "solid-js";
import type { TransactionType } from "../lib/supabase";

interface Props {
  onAdd: (entry: {
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
  }) => Promise<void> | void;
}

const CATEGORIES_INCOME: { value: string; label: string }[] = [
  { value: "เงินเดือน", label: "เงินเดือน" },
  { value: "โบนัส", label: "โบนัส" },
  { value: "งานเสริม", label: "งานเสริม" },
  { value: "ลงทุน", label: "ลงทุน" },
  { value: "คืนเงิน/ยืมคืน", label: "คืนเงิน/ยืมคืน" },
  { value: "__other__", label: "อื่นๆ" },
];

const CATEGORIES_EXPENSE: { value: string; label: string }[] = [
  { value: "อาหาร/เครื่องดื่ม", label: "อาหาร/เครื่องดื่ม" },
  { value: "ค่าขนส่ง", label: "ค่าขนส่ง" },
  { value: "ค่าที่อยู่", label: "ค่าที่อยู่" },
  { value: "ค่าโทร/เน็ต", label: "ค่าโทร/เน็ต" },
  { value: "สันทนาการ", label: "สันทนาการ" },
  { value: "ซื้อของใช้", label: "ซื้อของใช้" },
  { value: "สุขภาพ", label: "สุขภาพ" },
  { value: "การศึกษา", label: "การศึกษา" },
  { value: "__other__", label: "อื่นๆ" },
];

const PAYMENT_METHODS = [
    { value: "transfer", label: "โอนเงิน" },
    { value: "cash", label: "เงินสด" },
    { value: "wallet", label: "วอลเลท" },
    { value: "card", label: "บัตรเครดิต/เดบิต" },
    { value: "__other__", label: "อื่นๆ" },
];

const BANKS = [
    { value: "BBL", label: "Bangkok Bank (BBL)", color: "linear-gradient(90deg, #003399, #FF6E00)" },
    { value: "SCB", label: "Siam Commercial Bank (SCB)", color: "#462279" },
    { value: "KBANK", label: "Kasikornbank (KBank)", color: "#00A650" },
    { value: "BAY", label: "Bank of Ayudhya (Krungsri)", color: "#FBD600" },
    { value: "KTB", label: "Krungthai Bank (KTB)", color: "#01547E" },
    { value: "GSB", label: "Government Savings Bank (GSB)", color: "#FFE8F8" },
    { value: "TTB", label: "TMBThanachart Bank (ttb)", color: "linear-gradient(90deg, #00569a, #ef3224)" },
    { value: "__other__", label: "อื่นๆ" },
];

const PRESET_EMOJIS = ["💰", "🍜", "🚗", "🛒", "📱", "🏠", "✈️", "🎁", "💵", "📊", "🍕", "☕"];

const OTHER_VALUE = "__other__";

export default function AddForm(props: Props) {
  const [type, setType] = createSignal<TransactionType>("expense");
  const [amount, setAmount] = createSignal("");
  const [category, setCategory] = createSignal("");
  const [categoryOther, setCategoryOther] = createSignal("");
  const [note, setNote] = createSignal("");
  const [emoji, setEmoji] = createSignal("💰");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  
  // New States
  const [method, setMethod] = createSignal("");
  const [methodOther, setMethodOther] = createSignal("");
  const [bank, setBank] = createSignal("");
  const [bankOther, setBankOther] = createSignal("");
  const [party, setParty] = createSignal("");
  const [item, setItem] = createSignal("");
  const [location, setLocation] = createSignal("");

  function categories() {
    return type() === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (isSubmitting()) return;

    const num = parseFloat(amount().replace(/,/g, ""));
    if (!Number.isFinite(num) || num <= 0) return;
    
    setIsSubmitting(true);
    try {
      // Process "Other" fields
      const finalCategory = category() === OTHER_VALUE ? categoryOther().trim() || "อื่นๆ" : category();
      const finalMethod = method() === OTHER_VALUE ? methodOther().trim() || "อื่นๆ" : method();
      const finalBank = bank() === OTHER_VALUE ? bankOther().trim() || "อื่นๆ" : bank();

      await props.onAdd({
        type: type(),
        amount: num,
        category: finalCategory,
        note: note().trim(),
        emoji: emoji(),
        method: finalMethod,
        bank: finalBank,
        party: party().trim(),
        item: item().trim(),
        location: location().trim(),
      });
      
      // Reset Form
      setAmount("");
      setCategory("");
      setCategoryOther("");
      setNote("");
      setMethod("");
      setMethodOther("");
      setBank("");
      setBankOther("");
      setParty("");
      setItem("");
      setLocation("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} class="bg-[var(--card)] rounded-2xl p-5 border border-white/5">
      <div class="flex gap-2 mb-4">
        <button
          type="button"
          class={`flex-1 py-2.5 rounded-xl font-medium transition ${
            type() === "income"
              ? "bg-[var(--income)] text-white"
              : "bg-white/10 text-[var(--muted)]"
          }`}
          onClick={() => {
            setType("income");
            setCategory("");
            setCategoryOther("");
          }}
        >
          รายรับ
        </button>
        <button
          type="button"
          class={`flex-1 py-2.5 rounded-xl font-medium transition ${
            type() === "expense"
              ? "bg-[var(--expense)] text-white"
              : "bg-white/10 text-[var(--muted)]"
          }`}
          onClick={() => {
            setType("expense");
            setCategory("");
            setCategoryOther("");
          }}
        >
          รายจ่าย
        </button>
      </div>

      <div class="mb-4">
        <label class="block text-sm text-[var(--muted)] mb-1">จำนวนเงิน (บาท)</label>
        <input
          type="text"
          inputmode="decimal"
          placeholder="0"
          class="w-full text-3xl amount-display font-bold bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          value={amount()}
          onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
          required
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm text-[var(--muted)] mb-1">หมวดหมู่</label>
        <select
          class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          value={category()}
          onInput={(e) => setCategory((e.target as HTMLSelectElement).value)}
        >
          <option value="" class="bg-[var(--card)] text-[var(--text)]">— เลือกหมวด —</option>
          {categories().map((c) => (
            <option value={c.value} class="bg-[var(--card)] text-[var(--text)]">{c.label}</option>
          ))}
        </select>
        <Show when={category() === OTHER_VALUE}>
          <input
            type="text"
            placeholder="พิมพ์หมวดหมู่เอง"
            class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={categoryOther()}
            onInput={(e) => setCategoryOther((e.target as HTMLInputElement).value)}
          />
        </Show>
      </div>
      
      {/* New Fields */}
      <div class="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-[var(--muted)] mb-1">ช่องทาง</label>
            <select
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={method()}
                onInput={(e) => setMethod((e.target as HTMLSelectElement).value)}
            >
                <option value="" class="bg-[var(--card)] text-[var(--text)]">— เลือก —</option>
                {PAYMENT_METHODS.map((c) => (
                    <option value={c.value} class="bg-[var(--card)] text-[var(--text)]">{c.label}</option>
                ))}
            </select>
            <Show when={method() === OTHER_VALUE}>
                <input
                    type="text"
                    placeholder="ระบุ"
                    class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    value={methodOther()}
                    onInput={(e) => setMethodOther((e.target as HTMLInputElement).value)}
                />
            </Show>
          </div>
          <div>
            <label class="block text-sm text-[var(--muted)] mb-1">ธนาคาร</label>
            <select
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={bank()}
                onInput={(e) => setBank((e.target as HTMLSelectElement).value)}
                style={{
                  'background': BANKS.find(b => b.value === bank())?.color || ''
                }}
            >
                <option value="" class="bg-[var(--card)] text-[var(--text)]">— เลือก —</option>
                {BANKS.map((c) => (
                    <option 
                        value={c.value} 
                        class="bg-[var(--card)] text-[var(--text)]"
                    >
                        {c.label}
                    </option>
                ))}
            </select>
             <Show when={bank() === OTHER_VALUE}>
                <input
                    type="text"
                    placeholder="ระบุ"
                    class="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    value={bankOther()}
                    onInput={(e) => setBankOther((e.target as HTMLInputElement).value)}
                />
            </Show>
          </div>
      </div>
      
      <div class="mb-4">
          <label class="block text-sm text-[var(--muted)] mb-1">{type() === 'income' ? 'รับจาก' : 'จ่ายให้'}</label>
          <input
            type="text"
            placeholder={type() === 'income' ? "ได้รับเงินจากใคร..." : "จ่ายเงินให้ใคร..."}
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={party()}
            onInput={(e) => setParty((e.target as HTMLInputElement).value)}
          />
      </div>

      <div class="mb-4">
          <label class="block text-sm text-[var(--muted)] mb-1">สินค้า / บริการ</label>
          <input
            type="text"
            placeholder="เช่น ค่าข้าว, ซื้อเสื้อผ้า..."
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={item()}
            onInput={(e) => setItem((e.target as HTMLInputElement).value)}
          />
      </div>

       <div class="mb-4">
          <label class="block text-sm text-[var(--muted)] mb-1">สถานที่</label>
          <input
            type="text"
            placeholder="สถานที่"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={location()}
            onInput={(e) => setLocation((e.target as HTMLInputElement).value)}
          />
      </div>

      <div class="mb-4">
        <label class="block text-sm text-[var(--muted)] mb-1">อีโมจิ (ใช้อีโมจิของอุปกรณ์ได้)</label>
        <div class="flex flex-wrap gap-2">
          {PRESET_EMOJIS.map((e) => (
            <button
              type="button"
              class={`emoji-native w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                emoji() === e ? "bg-[var(--accent)] scale-110" : "bg-white/10 hover:bg-white/15"
              }`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="หรือพิมพ์อีโมจิเอง"
          class="emoji-native mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          value={emoji()}
          onInput={(e) => setEmoji((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="mb-5">
        <label class="block text-sm text-[var(--muted)] mb-1">หมายเหตุ</label>
        <input
          type="text"
          placeholder="ไม่บังคับ"
          class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          value={note()}
          onInput={(e) => setNote((e.target as HTMLInputElement).value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting()}
        class="w-full py-3.5 rounded-xl font-semibold bg-[var(--accent)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting() ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
