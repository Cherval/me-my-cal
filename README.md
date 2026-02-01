# Me My Cal — บันทึกรายรับรายจ่าย

เว็บแอปบันทึกรายรับรายจ่าย ใช้ **Bun** + **SolidJS** + **Supabase** + **Tailwind**  
ตัวเลขเน้นใหญ่เด่นชัด รองรับอีโมจิของอุปกรณ์

## Stack

- **Runtime**: Bun
- **Frontend**: SolidJS + Vite + Tailwind CSS
- **Backend/DB**: Supabase (Auth + Postgres + RLS)
- **Deploy**: Vercel (GitHub → Vercel)

## วิธีรัน

1. ติดตั้ง dependencies (ใช้ Bun):
   ```bash
   bun install
   ```

2. ตั้งค่า Supabase:
   - คัดลอก `.env.example` เป็น `.env`
   - ใส่ `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`  
     (Anon Key หาได้ที่ Supabase Dashboard → Project Settings → API → anon public)

3. รัน Schema ใน Supabase:
   - เปิด Supabase Dashboard → SQL Editor
   - วางเนื้อหาจาก `supabase/schema.sql` แล้วรัน

4. (ถ้าใช้ Anonymous) เปิด Anonymous Sign-in:
   - Authentication → Providers → Anonymous → Enable

5. รัน dev:
   ```bash
   bun run dev
   ```

6. Build + Preview:
   ```bash
   bun run build
   bun run preview
   ```

## Deploy บน Vercel

1. Push โปรเจกต์ขึ้น GitHub
2. เชื่อม Vercel กับ repo
3. ตั้ง Environment Variables ใน Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy (Vercel จะใช้ `vite build` อัตโนมัติ)

## โครงสร้าง DB (Schema + RLS)

- ตาราง `public.transactions`: id, user_id, type (income/expense), amount, category, note, emoji, created_at
- RLS เปิดไว้: ผู้ใช้เห็น/เพิ่ม/แก้/ลบได้เฉพาะแถวของตัวเอง (auth.uid() = user_id)
- ใช้ Anonymous Auth ได้ เพื่อให้ใช้ได้โดยไม่ต้องสมัคร
