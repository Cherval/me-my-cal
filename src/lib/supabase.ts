import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  emoji: string | null;
  created_at: string;
  // New columns
  method: string | null; // transfer, cash, wallet, card, other
  bank: string | null;   // BBL, SCB, etc.
  party: string | null;  // Received from / Paid to
  item: string | null;   // Goods / Service
  location: string | null; // Google Places
}
