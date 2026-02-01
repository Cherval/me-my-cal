import { createSignal, onMount, createEffect, Show, For, onCleanup } from "solid-js";
import { createGrid, GridApi, GridOptions, ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { Transaction, TransactionType } from "../lib/supabase";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  transactions: Transaction[];
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

// Categories
const CATEGORIES_INCOME = [
  { value: "เงินเดือน", label: "เงินเดือน" },
  { value: "โบนัส", label: "โบนัส" },
  { value: "งานเสริม", label: "งานเสริม" },
  { value: "ลงทุน", label: "ลงทุน" },
  { value: "คืนเงิน/ยืมคืน", label: "คืนเงิน/ยืมคืน" },
];

const CATEGORIES_EXPENSE = [
  { value: "อาหาร/เครื่องดื่ม", label: "อาหาร/เครื่องดื่ม" },
  { value: "ค่าขนส่ง", label: "ค่าขนส่ง" },
  { value: "ค่าที่อยู่", label: "ค่าที่อยู่" },
  { value: "ค่าโทร/เน็ต", label: "ค่าโทร/เน็ต" },
  { value: "สันทนาการ", label: "สันทนาการ" },
  { value: "ซื้อของใช้", label: "ซื้อของใช้" },
  { value: "สุขภาพ", label: "สุขภาพ" },
  { value: "การศึกษา", label: "การศึกษา" },
];

const BANKS = [
  { value: "BBL", label: "Bangkok Bank (BBL)" },
  { value: "SCB", label: "SCB" },
  { value: "KBANK", label: "KBank" },
  { value: "BAY", label: "Krungsri" },
  { value: "KTB", label: "Krungthai" },
  { value: "GSB", label: "GSB" },
  { value: "TTB", label: "ttb" },
];

const PAYMENT_METHODS = [
  { value: "transfer", label: "โอนเงิน" },
  { value: "cash", label: "เงินสด" },
  { value: "wallet", label: "วอลเลท" },
  { value: "card", label: "บัตรเครดิต/เดบิต" },
];

const BANK_COLORS: Record<string, string> = {
  "BBL": "#1e40af",
  "SCB": "#7e22ce",
  "KBANK": "#15803d",
  "BAY": "#ca8a04",
  "KTB": "#0ea5e9",
  "GSB": "#db2777",
  "TTB": "#2563eb",
};

export default function TransactionsPage(props: Props) {
  let gridContainer: HTMLDivElement | undefined;
  let gridApi: GridApi | undefined;

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [deleteId, setDeleteId] = createSignal<string | null>(null);
  const [isDeleting, setIsDeleting] = createSignal(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [editRow, setEditRow] = createSignal<Transaction | null>(null);
  const [isSaving, setIsSaving] = createSignal(false);

  const confirmDelete = async () => {
    const id = deleteId();
    if (id && !isDeleting()) {
      setIsDeleting(true);
      try {
        await props.onDelete(id);
        setShowDeleteModal(false);
        setDeleteId(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const openEditModal = (row: Transaction) => {
    setEditRow({ ...row });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    const row = editRow();
    if (row && !isSaving()) {
      setIsSaving(true);
      try {
        const updates: Partial<Transaction> = {};
        if (row.created_at) updates.created_at = row.created_at;
        if (row.type) updates.type = row.type;
        if (row.category !== undefined) updates.category = row.category || null;
        if (row.amount !== undefined) updates.amount = Number(row.amount);
        if (row.note !== undefined) updates.note = row.note || null;
        if (row.bank !== undefined) updates.bank = row.bank || null;
        if (row.method !== undefined) updates.method = row.method || null;
        if (row.party !== undefined) updates.party = row.party || null;
        if (row.item !== undefined) updates.item = row.item || null;
        if (row.location !== undefined) updates.location = row.location || null;
        if (row.emoji !== undefined) updates.emoji = row.emoji || null;
        
        await props.onUpdate(row.id, updates);
        setShowEditModal(false);
        setEditRow(null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Make functions available globally for cell renderer
  (window as any).__openEditModal = openEditModal;
  (window as any).__openDeleteModal = openDeleteModal;

  const columnDefs: ColDef[] = [
    { 
      field: "created_at", 
      headerName: "วันที่", 
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    },
    { 
      field: "type", 
      headerName: "ประเภท", 
      width: 100,
      cellRenderer: (params: ICellRendererParams) => {
        const isIncome = params.value === 'income';
        const span = document.createElement('span');
        span.style.cssText = `
          background-color: ${isIncome ? '#166534' : '#991b1b'};
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        `;
        span.textContent = isIncome ? 'รายรับ' : 'รายจ่าย';
        return span;
      }
    },
    { 
      field: "category", 
      headerName: "หมวดหมู่", 
      width: 150,
      cellRenderer: (params: ICellRendererParams) => {
        const span = document.createElement('span');
        span.innerHTML = `<span style="font-size:16px;margin-right:8px">${params.data?.emoji || '🏷️'}</span>${params.value || '-'}`;
        return span;
      }
    },
    { 
      field: "amount", 
      headerName: "จำนวน", 
      width: 120,
      cellRenderer: (params: ICellRendererParams) => {
        const isIncome = params.data?.type === 'income';
        const span = document.createElement('span');
        span.style.cssText = `font-weight: 700; font-size: 15px; color: ${isIncome ? '#4ade80' : '#f87171'};`;
        span.textContent = (isIncome ? '+' : '-') + Number(params.value).toLocaleString();
        return span;
      }
    },
    { field: "note", headerName: "โน้ต", width: 180 },
    { 
      field: "bank", 
      headerName: "ธนาคาร", 
      width: 100,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return '-';
        const color = BANK_COLORS[params.value] || '#52525b';
        const span = document.createElement('span');
        span.style.cssText = `background-color: ${color}; color: #fff; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;`;
        span.textContent = params.value;
        return span;
      }
    },
    { field: "method", headerName: "ช่องทาง", width: 100 },
    { field: "party", headerName: "คู่กรณี", width: 130 },
    { field: "item", headerName: "สินค้า/บริการ", width: 130 },
    { field: "location", headerName: "สถานที่", width: 130 },
    { 
      field: "actions", 
      headerName: "", 
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 4px;';
        
        const editBtn = document.createElement('button');
        editBtn.style.cssText = 'color: #60a5fa; background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 6px; cursor: pointer; padding: 4px 8px; font-size: 14px;';
        editBtn.textContent = '✏️';
        editBtn.onclick = () => (window as any).__openEditModal(params.data);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.style.cssText = 'color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; padding: 4px 8px; font-size: 14px;';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = () => (window as any).__openDeleteModal(params.data.id);
        
        container.appendChild(editBtn);
        container.appendChild(deleteBtn);
        return container;
      }
    }
  ];

  const gridOptions: GridOptions = {
    columnDefs,
    rowData: props.transactions,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
    },
    animateRows: true,
    rowSelection: 'single',
    headerHeight: 48,
    rowHeight: 44,
  };

  onMount(() => {
    if (gridContainer) {
      gridApi = createGrid(gridContainer, gridOptions);
    }
  });

  createEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('rowData', props.transactions);
    }
  });

  onCleanup(() => {
    if (gridApi) {
      gridApi.destroy();
    }
  });

  const currentCategories = () => {
    const row = editRow();
    return row?.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
  };

  return (
    <>
      <style>{`
        .ag-theme-alpine-dark {
          --ag-background-color: #18181b;
          --ag-header-background-color: #27272a;
          --ag-odd-row-background-color: #1f1f23;
          --ag-row-hover-color: #3f3f46;
          --ag-header-foreground-color: #ffffff;
          --ag-foreground-color: #e4e4e7;
          --ag-border-color: #3f3f46;
          --ag-secondary-border-color: #27272a;
          --ag-row-border-color: #27272a;
          --ag-selected-row-background-color: #4c1d95;
          --ag-range-selection-border-color: #8b5cf6;
        }
        .ag-theme-alpine-dark .ag-header-cell {
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ag-theme-alpine-dark .ag-header-row {
          border-bottom: 3px solid #8b5cf6;
        }
      `}</style>

      <div 
        ref={gridContainer}
        class="ag-theme-alpine-dark h-[calc(100vh-140px)] w-full rounded-xl overflow-hidden border border-zinc-600"
      />

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteModal()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 class="text-lg font-semibold text-white mb-2">ยืนยันการลบ?</h3>
            <p class="text-zinc-400 mb-6">คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div class="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting()}
                class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting()}
                class="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting() ? "กำลังลบ..." : "ลบรายการ"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Modal */}
      <Show when={showEditModal() && editRow()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-lg font-semibold text-white mb-4">แก้ไขรายการ</h3>
            
            <div class="space-y-4">
              {/* Date */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">วันที่</label>
                <input 
                  type="datetime-local" 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.created_at?.slice(0, 16) || ''}
                  onInput={(e) => setEditRow({ ...editRow()!, created_at: new Date(e.currentTarget.value).toISOString() })}
                />
              </div>

              {/* Type */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">ประเภท</label>
                <select 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.type || 'expense'}
                  onChange={(e) => setEditRow({ ...editRow()!, type: e.currentTarget.value as TransactionType })}
                >
                  <option value="income">รายรับ</option>
                  <option value="expense">รายจ่าย</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">หมวดหมู่</label>
                <select 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.category || ''}
                  onChange={(e) => setEditRow({ ...editRow()!, category: e.currentTarget.value })}
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  <For each={currentCategories()}>
                    {(cat) => <option value={cat.value}>{cat.label}</option>}
                  </For>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">จำนวนเงิน</label>
                <input 
                  type="number" 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.amount || 0}
                  onInput={(e) => setEditRow({ ...editRow()!, amount: parseFloat(e.currentTarget.value) || 0 })}
                />
              </div>

              {/* Bank */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">ธนาคาร</label>
                <select 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.bank || ''}
                  onChange={(e) => setEditRow({ ...editRow()!, bank: e.currentTarget.value })}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  <For each={BANKS}>
                    {(b) => <option value={b.value}>{b.label}</option>}
                  </For>
                </select>
              </div>

              {/* Method */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">ช่องทาง</label>
                <select 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.method || ''}
                  onChange={(e) => setEditRow({ ...editRow()!, method: e.currentTarget.value })}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  <For each={PAYMENT_METHODS}>
                    {(m) => <option value={m.value}>{m.label}</option>}
                  </For>
                </select>
              </div>

              {/* Note */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">โน้ต</label>
                <input 
                  type="text" 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.note || ''}
                  onInput={(e) => setEditRow({ ...editRow()!, note: e.currentTarget.value })}
                />
              </div>

              {/* Party */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">คู่กรณี</label>
                <input 
                  type="text" 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.party || ''}
                  onInput={(e) => setEditRow({ ...editRow()!, party: e.currentTarget.value })}
                />
              </div>

              {/* Item */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">สินค้า/บริการ</label>
                <input 
                  type="text" 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.item || ''}
                  onInput={(e) => setEditRow({ ...editRow()!, item: e.currentTarget.value })}
                />
              </div>

              {/* Location */}
              <div>
                <label class="block text-sm text-zinc-400 mb-1">สถานที่</label>
                <input 
                  type="text" 
                  class="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editRow()?.location || ''}
                  onInput={(e) => setEditRow({ ...editRow()!, location: e.currentTarget.value })}
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowEditModal(false)}
                disabled={isSaving()}
                class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={saveEdit}
                disabled={isSaving()}
                class="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50"
              >
                {isSaving() ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
