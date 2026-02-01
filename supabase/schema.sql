-- ============================================
-- Me My Cal: Table Schema + RLS
-- รันใน Supabase SQL Editor
-- ============================================

-- ตารางรายการ (รายรับ/รายจ่าย)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT '',
  note TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index สำหรับ query ตาม user + วันที่
CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON public.transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type
  ON public.transactions (user_id, type);

-- เปิด RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- นโยบาย: ผู้ใช้เห็นเฉพาะของตัวเอง
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- นโยบาย: ผู้ใช้เพิ่มได้เฉพาะของตัวเอง
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- นโยบาย: ผู้ใช้แก้ไขได้เฉพาะของตัวเอง
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- นโยบาย: ผู้ใช้ลบได้เฉพาะของตัวเอง
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ถ้าต้องการให้ใช้ได้โดยไม่ต้องสมัคร (Anonymous):
-- เปิด Anonymous Sign-in ใน Supabase Dashboard > Authentication > Providers
-- RLS ด้านบนจะใช้ auth.uid() ได้กับ anonymous user เช่นกัน

COMMENT ON TABLE public.transactions IS 'รายรับรายจ่าย แยกตาม user_id';

-- (Optional) เปิด Realtime: Supabase Dashboard → Database → Replication → เปิดตาราง public.transactions
-- ถ้ามีข้อมูลในตารางแต่ไม่แสดง: ตรวจสอบว่า user_id ในแถวตรงกับ UID ของบัญชีที่ล็อกอิน (Auth → Users → UID)
