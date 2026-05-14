
CREATE OR REPLACE FUNCTION public.admin_get_economy_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_out jsonb;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  WITH win AS (
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE amount > 0 AND created_at > now()-interval '24 hours'),0) mint_24h,
      COALESCE(SUM(-amount) FILTER (WHERE amount < 0 AND created_at > now()-interval '24 hours'),0) burn_24h,
      COALESCE(SUM(amount) FILTER (WHERE amount > 0 AND created_at > now()-interval '7 days'),0) mint_7d,
      COALESCE(SUM(-amount) FILTER (WHERE amount < 0 AND created_at > now()-interval '7 days'),0) burn_7d,
      COALESCE(SUM(amount) FILTER (WHERE amount > 0 AND created_at > now()-interval '30 days'),0) mint_30d,
      COALESCE(SUM(-amount) FILTER (WHERE amount < 0 AND created_at > now()-interval '30 days'),0) burn_30d
    FROM phon_transactions
  ),
  total AS (SELECT COALESCE(SUM(balance),0) AS supply, COUNT(*) holders FROM phon_balances),
  nft_dist AS (
    SELECT jsonb_object_agg(type || '_' || level, n) AS dist
    FROM (SELECT type, level, COUNT(*) n FROM nft_collection GROUP BY type, level) t
  ),
  top20 AS (
    SELECT jsonb_agg(jsonb_build_object('user_id',user_id,'balance',balance) ORDER BY balance DESC) AS top
    FROM (SELECT user_id, balance FROM phon_balances ORDER BY balance DESC LIMIT 20) t
  )
  SELECT jsonb_build_object(
    'phon_supply',(SELECT supply FROM total),
    'phon_holders',(SELECT holders FROM total),
    'mint_24h',(SELECT mint_24h FROM win),'burn_24h',(SELECT burn_24h FROM win),'net_24h',(SELECT mint_24h-burn_24h FROM win),
    'mint_7d',(SELECT mint_7d FROM win),'burn_7d',(SELECT burn_7d FROM win),'net_7d',(SELECT mint_7d-burn_7d FROM win),
    'mint_30d',(SELECT mint_30d FROM win),'burn_30d',(SELECT burn_30d FROM win),'net_30d',(SELECT mint_30d-burn_30d FROM win),
    'nft_distribution',COALESCE((SELECT dist FROM nft_dist),'{}'::jsonb),
    'nft_total',(SELECT COUNT(*) FROM nft_collection),
    'top_holders',COALESCE((SELECT top FROM top20),'[]'::jsonb),
    'active_bequests',(SELECT COUNT(*) FROM bequest_requests WHERE status IN ('cooldown','executable')),
    'dynasty_links_active',(SELECT COUNT(*) FROM dynasty_links WHERE status='active')
  ) INTO v_out;
  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_bequests(_limit int DEFAULT 100)
RETURNS TABLE(id uuid, parent_id uuid, child_id uuid, asset_kind text, phon_amount numeric, nft_id uuid, status text, cooldown_until timestamptz, created_at timestamptz, executed_at timestamptz, cancelled_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, parent_id, child_id, asset_kind, phon_amount, nft_id, status, cooldown_until, created_at, executed_at, cancelled_at
  FROM bequest_requests
  WHERE has_role(auth.uid(),'admin')
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
$$;

CREATE OR REPLACE FUNCTION public.admin_phon_adjust(_uid uuid, _delta numeric, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 5 THEN RAISE EXCEPTION 'reason_required'; END IF;
  IF _delta = 0 THEN RAISE EXCEPTION 'zero_delta'; END IF;
  INSERT INTO phon_balances(user_id, balance) VALUES (_uid, GREATEST(0,_delta))
    ON CONFLICT (user_id) DO UPDATE SET balance = GREATEST(0, phon_balances.balance + _delta), updated_at = now();
  INSERT INTO phon_transactions(user_id, amount, kind, ref, meta)
    VALUES (_uid, _delta, 'admin_adjust', 'admin_' || auth.uid()::text, jsonb_build_object('reason',_reason,'admin_id',auth.uid()));
  RETURN jsonb_build_object('ok',true,'delta',_delta);
END;
$$;

CREATE OR REPLACE FUNCTION public.take_phon_snapshot()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE phon_balances SET snapshot_at = now(), snapshot_balance = balance;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'snapshotted', v_n, 'at', now());
END;
$$;
