
-- ============ fuse_nft ============
-- Burn 3 same (type, level) NFTs (bronze→gold, gold→diamond) → mint 1 next-tier NFT.
CREATE OR REPLACE FUNCTION public.fuse_nft(_nft_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec record;
  rows_count int;
  src_type text;
  src_level text;
  next_level text;
  next_boost int;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF _nft_ids IS NULL OR array_length(_nft_ids, 1) <> 3 THEN
    RAISE EXCEPTION 'fuse_requires_exactly_3_nfts';
  END IF;

  -- Lock + verify ownership and uniformity
  SELECT
    COUNT(*)               AS c,
    MIN(type)              AS t_min,
    MAX(type)              AS t_max,
    MIN(level)             AS l_min,
    MAX(level)             AS l_max
  INTO rec
  FROM public.nft_collection
  WHERE id = ANY(_nft_ids)
    AND user_id = uid
    AND COALESCE(locked_for_migration, false) = false
  FOR UPDATE;

  IF rec.c <> 3 THEN RAISE EXCEPTION 'nfts_not_owned_or_locked'; END IF;
  IF rec.t_min <> rec.t_max THEN RAISE EXCEPTION 'fuse_requires_same_type'; END IF;
  IF rec.l_min <> rec.l_max THEN RAISE EXCEPTION 'fuse_requires_same_level'; END IF;

  src_type  := rec.t_min;
  src_level := rec.l_min;

  IF src_level = 'bronze' THEN next_level := 'gold'; next_boost := 25;
  ELSIF src_level = 'gold' THEN next_level := 'diamond'; next_boost := 50;
  ELSE RAISE EXCEPTION 'cannot_fuse_diamond';
  END IF;

  -- Burn the 3 source NFTs
  DELETE FROM public.nft_collection WHERE id = ANY(_nft_ids) AND user_id = uid;
  GET DIAGNOSTICS rows_count = ROW_COUNT;
  IF rows_count <> 3 THEN RAISE EXCEPTION 'burn_failed'; END IF;

  -- Mint the new NFT (source = 'fusion' for traceability)
  new_id := gen_random_uuid();
  INSERT INTO public.nft_collection (id, user_id, type, level, boost_pct, source, source_ref, created_at)
  VALUES (new_id, uid, src_type, next_level, next_boost, 'fusion', new_id::text, now());

  RETURN jsonb_build_object(
    'ok', true,
    'new_nft_id', new_id,
    'type', src_type,
    'level', next_level,
    'boost_pct', next_boost
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fuse_nft(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fuse_nft(uuid[]) TO authenticated, service_role;

-- ============ get_my_hybrid_net ============
CREATE OR REPLACE FUNCTION public.get_my_hybrid_net()
RETURNS TABLE(
  symbol text,
  long_count int,
  short_count int,
  long_size numeric,
  short_size numeric,
  net_size numeric,
  net_side text,
  total_margin numeric,
  weighted_entry numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;

  RETURN QUERY
  WITH p AS (
    SELECT
      lp.symbol,
      lp.side,
      lp.size,
      lp.margin,
      lp.entry
    FROM public.live_positions lp
    WHERE lp.user_id = uid AND lp.status = 'open'
  ), agg AS (
    SELECT
      p.symbol,
      SUM(CASE WHEN p.side='long'  THEN 1 ELSE 0 END)::int AS long_count,
      SUM(CASE WHEN p.side='short' THEN 1 ELSE 0 END)::int AS short_count,
      COALESCE(SUM(CASE WHEN p.side='long'  THEN p.size ELSE 0 END), 0)::numeric AS long_size,
      COALESCE(SUM(CASE WHEN p.side='short' THEN p.size ELSE 0 END), 0)::numeric AS short_size,
      COALESCE(SUM(p.margin), 0)::numeric AS total_margin,
      CASE
        WHEN COALESCE(SUM(p.size), 0) = 0 THEN NULL
        ELSE COALESCE(SUM(p.entry * p.size), 0) / NULLIF(SUM(p.size), 0)
      END AS weighted_entry
    FROM p
    GROUP BY p.symbol
  )
  SELECT
    a.symbol,
    a.long_count,
    a.short_count,
    a.long_size,
    a.short_size,
    (a.long_size - a.short_size) AS net_size,
    CASE WHEN (a.long_size - a.short_size) > 0 THEN 'long'
         WHEN (a.long_size - a.short_size) < 0 THEN 'short'
         ELSE 'flat' END AS net_side,
    a.total_margin,
    a.weighted_entry
  FROM agg a
  ORDER BY ABS(a.long_size - a.short_size) DESC, a.symbol;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_hybrid_net() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_hybrid_net() TO authenticated, service_role;

-- ============ baseline registration ============
INSERT INTO public.function_permissions_baseline (function_name, function_args, allowed_roles, category, note)
VALUES
  ('fuse_nft', 'uuid[]', ARRAY['authenticated','service_role'], 'nft',
    'Phase B — burns 3 same type+level NFTs, mints 1 next-tier (bronze→gold→diamond). auth.uid() guarded.'),
  ('get_my_hybrid_net', '', ARRAY['authenticated','service_role'], 'trading',
    'Phase B — per-symbol netted view of caller live_positions. auth.uid() guarded, read-only.')
ON CONFLICT (function_name, function_args) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    category = EXCLUDED.category,
    note = EXCLUDED.note,
    updated_at = now();
