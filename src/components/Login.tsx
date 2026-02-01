import { createSignal, Show } from "solid-js";
import { supabase } from "../lib/supabase";

interface Props {
  onSuccess: () => void;
  onUseDemo: () => void;
}

export default function Login(props: Props) {
  const [showEmailForm, setShowEmailForm] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [message, setMessage] = createSignal<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = createSignal(false);

  async function signInWithGoogle() {
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
  }

  async function submitEmail(e: Event) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const emailVal = email().trim();
    const passwordVal = password();
    if (!emailVal || !passwordVal) {
      setMessage({ type: "error", text: "กรอกอีเมลและรหัสผ่าน" });
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passwordVal });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    props.onSuccess();
  }

  return (
    <div class="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div class="w-full max-w-sm bg-[var(--card)] rounded-2xl p-6 border border-white/5 shadow-xl">
        <h2 class="text-xl font-semibold text-center mb-6">เข้าสู่ระบบ</h2>

        <button
          type="button"
          disabled={loading()}
          onClick={signInWithGoogle}
          class="w-full py-3 rounded-xl font-semibold bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading() ? "กำลังดำเนินการ..." : "เข้าสู่ระบบด้วย Google"}
        </button>

        <Show when={message()}>
          {(m) => (
            <p class={`text-sm mt-3 ${m.type === "error" ? "text-red-400" : "text-green-400"}`}>
              {m.text}
            </p>
          )}
        </Show>

        <p class="mt-4 text-center text-sm text-[var(--muted)]">
          <button
            type="button"
            class="text-[var(--accent)] hover:underline"
            onClick={() => {
              setShowEmailForm(!showEmailForm());
              setMessage(null);
            }}
          >
            {showEmailForm() ? "ซ่อนฟอร์มอีเมล" : "เข้าสู่ระบบด้วยอีเมล"}
          </button>
        </p>

        <Show when={showEmailForm()}>
          <form onSubmit={submitEmail} class="mt-4 pt-4 border-t border-white/10 space-y-4">
            <div>
              <label class="block text-sm text-[var(--muted)] mb-1">อีเมล</label>
              <input
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={email()}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              />
            </div>
            <div>
              <label class="block text-sm text-[var(--muted)] mb-1">รหัสผ่าน</label>
              <input
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={password()}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading()}
              class="w-full py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/15 disabled:opacity-50 transition"
            >
              เข้าสู่ระบบด้วยอีเมล
            </button>
          </form>
        </Show>

        <p class="mt-4 text-center">
          <button
            type="button"
            class="text-xs text-[var(--muted)] hover:underline"
            onClick={props.onUseDemo}
          >
            ใช้โหมด Demo (เก็บในเครื่อง)
          </button>
        </p>
      </div>
    </div>
  );
}
