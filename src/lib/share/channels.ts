/**
 * 7-channel share intent layer.
 * Each channel opens a web-share intent and calls claim_share_reward server-side.
 * Kakao uses the JS SDK when VITE_KAKAO_JS_KEY is set, else falls back to story share.
 */
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";

export type ShareChannel =
  | "kakao"
  | "kakaostory"
  | "x"
  | "threads"
  | "facebook"
  | "telegram"
  | "instagram";

export interface ShareIntentInput {
  url: string;          // landing URL (with ?ref=)
  text: string;         // headline + ko copy
  imageUrl: string;     // OG card URL (from buildShareCardUrl)
}

/* ---------- Kakao SDK (lazy) ---------- */
let kakaoLoaded: Promise<any> | null = null;
function loadKakao(): Promise<any> | null {
  if (typeof window === "undefined") return null;
  const key = (import.meta.env as any).VITE_KAKAO_JS_KEY as string | undefined;
  if (!key) return null;
  if ((window as any).Kakao?.isInitialized?.()) return Promise.resolve((window as any).Kakao);
  if (kakaoLoaded) return kakaoLoaded;
  kakaoLoaded = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
    s.integrity = "sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4";
    s.crossOrigin = "anonymous";
    s.onload = () => {
      const K = (window as any).Kakao;
      if (!K) return reject(new Error("kakao_failed"));
      if (!K.isInitialized()) K.init(key);
      resolve(K);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return kakaoLoaded;
}

/* ---------- Intent openers ---------- */
function openWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=560,height=720");
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

async function openChannel(channel: ShareChannel, input: ShareIntentInput): Promise<void> {
  const enc = encodeURIComponent;
  const { url, text, imageUrl } = input;

  switch (channel) {
    case "kakao": {
      const K = await loadKakao();
      if (K?.Share) {
        K.Share.sendDefault({
          objectType: "feed",
          content: {
            title: text,
            description: "phonara.world에서 무료로 시작하세요",
            imageUrl,
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{ title: "지금 시작", link: { mobileWebUrl: url, webUrl: url } }],
        });
      } else {
        // Fallback: story share opens a share dialog
        openWindow(`https://story.kakao.com/share?url=${enc(url)}`);
      }
      return;
    }
    case "kakaostory":
      openWindow(`https://story.kakao.com/share?url=${enc(url)}`);
      return;
    case "x":
      openWindow(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`);
      return;
    case "threads":
      openWindow(`https://www.threads.net/intent/post?text=${enc(`${text} ${url}`)}`);
      return;
    case "facebook":
      openWindow(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`);
      return;
    case "telegram":
      openWindow(`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`);
      return;
    case "instagram":
      // No web intent; download image so user can paste into IG story
      await downloadImage(imageUrl, `phonara-share-${Date.now()}.svg`);
      try {
        await navigator.clipboard.writeText(url);
      } catch { /* noop */ }
      notify.info("이미지를 저장해서 스토리에 올려주세요. 링크도 복사됐어요.");
      return;
  }
}

/* ---------- Public API ---------- */
export interface ShareResult {
  ok: boolean;
  amount?: number;
  already_claimed?: boolean;
  error?: string;
}

export async function shareAndClaim(
  channel: ShareChannel,
  input: ShareIntentInput,
): Promise<ShareResult> {
  try {
    await openChannel(channel, input);
  } catch (e) {
    notify.error("공유 창을 열지 못했어요");
    return { ok: false, error: (e as Error).message };
  }

  // Award via existing RPC (idempotent per kind/day server-side)
  try {
    const { data, error } = await supabase.rpc("claim_share_reward" as any, { _channel: channel });
    if (error) return { ok: false, error: error.message };
    const d = data as any;
    if (d?.already_claimed) return { ok: true, already_claimed: true, amount: d?.amount };
    if (d?.ok) {
      notify.success(`+${Number(d.amount ?? 200).toLocaleString()} PHON 공유 보상`);
      return { ok: true, amount: Number(d.amount ?? 200) };
    }
    return { ok: false, error: d?.error ?? "share_failed" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const CHANNEL_META: Record<ShareChannel, { label: string; emoji: string; accent: string }> = {
  kakao:      { label: "카카오톡",   emoji: "💬", accent: "from-yellow-400 to-yellow-500" },
  kakaostory: { label: "카카오스토리", emoji: "📖", accent: "from-yellow-300 to-amber-500" },
  x:          { label: "X (트위터)",  emoji: "𝕏",  accent: "from-zinc-800 to-zinc-900" },
  threads:    { label: "쓰레드",     emoji: "@",  accent: "from-zinc-700 to-zinc-900" },
  facebook:   { label: "페이스북",    emoji: "f",  accent: "from-blue-600 to-blue-800" },
  telegram:   { label: "텔레그램",    emoji: "✈️", accent: "from-sky-500 to-sky-700" },
  instagram:  { label: "인스타그램",  emoji: "📷", accent: "from-pink-500 via-rose-500 to-amber-400" },
};
