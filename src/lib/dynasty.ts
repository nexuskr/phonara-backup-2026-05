/**
 * Dynasty Bequest — 자녀 양도 시스템 클라이언트 래퍼.
 *
 * 흐름:
 *  1) 부모: requestDynasty(childEmail) → 토큰 발급 → 자녀에게 공유
 *  2) 자녀: acceptDynasty(token) — KYC level≥2 + 만 19세 이상 필수
 *  3) 부모: requestBequest(linkId, 'phon'|'nft', amount/nftId) — TOTP AAL2 필수
 *  4) 48h 후: executeBequest(reqId) — TOTP AAL2 필수
 *  5) 쿨다운 중 cancelBequest(reqId) 가능 (PHON 환원 / NFT 잠금해제)
 */
import { supabase } from "@/integrations/supabase/client";

export type DynastyLink = {
  id: string;
  role: "parent" | "child";
  parent_id: string;
  child_id: string | null;
  child_email: string;
  status: "pending" | "active" | "revoked" | "expired";
  created_at: string;
  accepted_at: string | null;
};

export type Bequest = {
  id: string;
  role: "parent" | "child";
  parent_id: string;
  child_id: string;
  asset_kind: "phon" | "nft";
  phon_amount: number | null;
  nft_id: string | null;
  status: "cooldown" | "executable" | "executed" | "cancelled" | "expired";
  cooldown_until: string;
  created_at: string;
  executed_at: string | null;
};

export async function requestDynasty(childEmail: string) {
  const { data, error } = await supabase.rpc("request_dynasty_link", { _child_email: childEmail });
  if (error) throw error;
  return data as { ok: true; invite_token: string };
}

export async function acceptDynasty(token: string) {
  const { data, error } = await supabase.rpc("accept_dynasty_link", { _token: token });
  if (error) throw error;
  return data as { ok: true; link_id: string };
}

export async function cancelDynasty(linkId: string) {
  const { data, error } = await supabase.rpc("cancel_dynasty_link", { _link_id: linkId });
  if (error) throw error;
  return data;
}

export async function getMyDynastyLinks(): Promise<DynastyLink[]> {
  const { data, error } = await supabase.rpc("get_my_dynasty_links");
  if (error) throw error;
  return (data ?? []) as DynastyLink[];
}

export async function requestBequest(args: {
  linkId: string;
  assetKind: "phon" | "nft";
  phonAmount?: number;
  nftId?: string;
}) {
  const { data, error } = await supabase.rpc("request_bequest", {
    _link_id: args.linkId,
    _asset_kind: args.assetKind,
    _phon_amount: args.phonAmount ?? null,
    _nft_id: args.nftId ?? null,
  });
  if (error) throw error;
  return data as { ok: true; request_id: string; cooldown_until: string };
}

export async function executeBequest(reqId: string) {
  const { data, error } = await supabase.rpc("execute_bequest", { _req_id: reqId });
  if (error) throw error;
  return data as { ok: true; asset_kind: "phon" | "nft" };
}

export async function cancelBequest(reqId: string) {
  const { data, error } = await supabase.rpc("cancel_bequest", { _req_id: reqId });
  if (error) throw error;
  return data;
}

export async function getMyBequests(): Promise<Bequest[]> {
  const { data, error } = await supabase.rpc("get_my_bequests");
  if (error) throw error;
  return (data ?? []) as Bequest[];
}
