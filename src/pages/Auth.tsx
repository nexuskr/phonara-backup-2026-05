import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Particles from "@/components/Particles";
import { Mail, Lock, User as UserIcon, Phone, Calendar, Hash, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";

// 🔥 Supabase 연결 (니 키 적용됨)
const supabase = createClient(
  "https://ywfldefkfktyyuccqnqt.supabase.co",
  "sb_publishable_ZOsZzwitmeGNWCVz_AUvzw_LIfuRav3",
);

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(params.get("signup") ? "signup" : "login");
  const nav = useNavigate();

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
    phone: "",
    phoneCode: "",
    realName: "",
    birth: "",
    referralCode: "",
  });

  const [phoneSent, setPhoneSent] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ✅ 이메일 로그인
  async function login() {
    if (!form.email || !form.password) {
      toast({ title: "이메일과 비밀번호를 입력해주세요" });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      toast({ title: "로그인 실패", description: error.message });
      return;
    }

    toast({ title: "로그인 성공 ✨" });
    nav("/dashboard");
  }

  function checkAge(birth: string) {
    if (!birth) return false;
    const d = new Date(birth);
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 14;
  }

  // ✅ 회원가입
  async function signup() {
    if (!form.email || !form.password) {
      toast({ title: "이메일 / 비밀번호 입력" });
      return;
    }

    if (!checkAge(form.birth)) {
      toast({ title: "만 14세 이상만 가입 가능" });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      toast({ title: "가입 실패", description: error.message });
      return;
    }

    toast({ title: "가입 성공 🎉" });
    nav("/dashboard");
  }

  // ✅ 🔥 진짜 구글 / 애플 로그인
  async function social(provider: "google" | "apple") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });

    if (error) {
      toast({ title: "소셜 로그인 실패", description: error.message });
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-10 px-4">
      <Particles density={45} />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
            폰
          </div>
          <span className="font-bold text-xl">PHONEMISSION</span>
        </Link>

        <div className="rounded-3xl p-6 bg-white/10 backdrop-blur">
          <div className="flex bg-muted/40 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded ${mode === m ? "bg-black text-white" : ""}`}
              >
                {m === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          {/* 🔥 소셜 로그인 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => social("google")} className="py-3 rounded bg-white text-black font-bold">
              Google
            </button>
            <button onClick={() => social("apple")} className="py-3 rounded bg-black text-white font-bold">
              Apple
            </button>
          </div>

          <div className="space-y-3">
            <input
              placeholder="이메일"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full p-3 rounded"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="w-full p-3 rounded"
            />

            {mode === "signup" && (
              <>
                <input
                  type="date"
                  value={form.birth}
                  onChange={(e) => set("birth", e.target.value)}
                  className="w-full p-3 rounded"
                />
              </>
            )}

            <button onClick={mode === "login" ? login : signup} className="w-full py-3 rounded bg-blue-500 text-white">
              {mode === "login" ? "로그인" : "회원가입"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
