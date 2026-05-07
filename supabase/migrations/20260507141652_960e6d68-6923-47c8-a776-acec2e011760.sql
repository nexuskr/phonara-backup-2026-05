REVOKE EXECUTE ON FUNCTION public.settle_mission(text, boolean, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_mission(text, boolean, bigint) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_withdrawal(bigint, public.withdrawal_method, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(bigint, public.withdrawal_method, text, text, text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_deposit(bigint, public.deposit_method, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_deposit(bigint, public.deposit_method, text, text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_package_purchase(text, text, bigint, bigint, integer, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_package_purchase(text, text, bigint, bigint, integer, bigint, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.bump_jackpot(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bump_jackpot(bigint) TO authenticated;

DROP POLICY IF EXISTS "chat insert" ON public.chat_messages;
CREATE POLICY "chat insert" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);