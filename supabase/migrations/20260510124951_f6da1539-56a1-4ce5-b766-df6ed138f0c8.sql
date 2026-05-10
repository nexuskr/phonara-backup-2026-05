
CREATE TABLE IF NOT EXISTS public.position_trigger_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL,
  leverage integer NOT NULL,
  margin bigint NOT NULL,
  entry numeric NOT NULL,
  exit_price numeric NOT NULL,
  mark_price numeric NOT NULL,
  pnl bigint NOT NULL,
  roi numeric NOT NULL,
  reason text NOT NULL,
  tp_pct numeric,
  sl_pct numeric,
  trailing_pct numeric,
  trailing_peak_roi_pct numeric,
  trailing_active boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'server',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pta_user_created ON public.position_trigger_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pta_reason_created ON public.position_trigger_audit(reason, created_at DESC);

ALTER TABLE public.position_trigger_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY pta_admin_read ON public.position_trigger_audit
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY pta_self_read ON public.position_trigger_audit
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.admin_force_close_position(p_position_id uuid, p_mark_price numeric, p_reason text DEFAULT 'tp'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  p record;
  v_exit numeric;
  v_pnl bigint;
  v_fee_close bigint;
  v_roi numeric;
  v_credit bigint;
  v_source text;
BEGIN
  IF NOT (auth.role() = 'service_role' OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_mark_price <= 0 THEN RAISE EXCEPTION 'invalid price'; END IF;
  IF p_reason NOT IN ('tp','sl','trailing','manual','liquidation','admin') THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;

  v_source := CASE WHEN auth.role() = 'service_role' THEN 'cron' ELSE 'admin' END;

  SELECT * INTO p FROM live_positions WHERE id=p_position_id AND status='open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position not found'; END IF;

  v_exit := CASE WHEN p.side='long' THEN p_mark_price * 0.9994 ELSE p_mark_price * 1.0006 END;
  v_pnl := FLOOR(((v_exit - p.entry) * p.size) * (CASE WHEN p.side='long' THEN 1 ELSE -1 END))::bigint;
  v_fee_close := FLOOR(v_exit * p.size * 0.001)::bigint;
  v_roi := v_pnl::numeric / NULLIF(p.margin,0);
  v_credit := GREATEST(0, p.margin + v_pnl - v_fee_close);

  UPDATE wallet_balances
    SET locked_balance    = GREATEST(0, locked_balance - p.margin),
        available_balance = available_balance + v_credit,
        total_balance     = total_balance + v_credit - p.margin - v_fee_close,
        updated_at = now()
    WHERE user_id=p.user_id;

  UPDATE insurance_fund SET accumulated = accumulated + FLOOR(v_fee_close*0.25)::bigint, updated_at=now() WHERE id=1;
  UPDATE live_positions SET status='closed' WHERE id=p.id;

  INSERT INTO live_trade_history(user_id,symbol,side,leverage,margin,size,entry,close_price,pnl,roi,fee_open,fee_close,reason,opened_at)
    VALUES(p.user_id,p.symbol,p.side,p.leverage,p.margin,p.size,p.entry,v_exit,v_pnl,v_roi,p.fee_open,v_fee_close,p_reason,p.opened_at);

  INSERT INTO transactions(user_id,kind,direction,amount,balance_after,available_after,ref_id,metadata)
  SELECT p.user_id,
    CASE WHEN v_pnl>=0 THEN 'trade_close_win'::tx_kind ELSE 'trade_close_loss'::tx_kind END,
    CASE WHEN v_pnl>=0 THEN 'in' ELSE 'out' END,
    ABS(v_pnl), total_balance, available_balance, p.id::text,
    jsonb_build_object('symbol',p.symbol,'side',p.side,'leverage',p.leverage,'pnl',v_pnl,'roi',v_roi,'exit',v_exit,'reason',p_reason)
  FROM wallet_balances WHERE user_id=p.user_id;

  INSERT INTO transactions(user_id,kind,direction,amount,balance_after,available_after,ref_id,metadata)
  SELECT p.user_id,'trade_fee','out',v_fee_close,total_balance,available_balance,p.id::text,
         jsonb_build_object('phase','close','reason',p_reason)
  FROM wallet_balances WHERE user_id=p.user_id;

  INSERT INTO position_trigger_audit(
    position_id, user_id, symbol, side, leverage, margin, entry, exit_price, mark_price,
    pnl, roi, reason, tp_pct, sl_pct, trailing_pct, trailing_peak_roi_pct, trailing_active,
    source, metadata
  ) VALUES (
    p.id, p.user_id, p.symbol, p.side, p.leverage, p.margin, p.entry, v_exit, p_mark_price,
    v_pnl, v_roi, p_reason, p.tp_pct, p.sl_pct, p.trailing_pct, p.trailing_peak_roi_pct, p.trailing_active,
    v_source,
    jsonb_build_object('fee_close', v_fee_close, 'opened_at', p.opened_at, 'size', p.size)
  );

  RETURN jsonb_build_object('pnl',v_pnl,'roi',v_roi,'exit',v_exit,'reason',p_reason);
END;
$function$;
