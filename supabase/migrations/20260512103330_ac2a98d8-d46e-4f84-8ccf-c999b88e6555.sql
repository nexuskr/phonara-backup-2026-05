-- 1) bot_settings: admin-only SELECT
DROP POLICY IF EXISTS bot_settings_read_authenticated ON public.bot_settings;
DROP POLICY IF EXISTS bot_settings_admin_select ON public.bot_settings;
CREATE POLICY bot_settings_admin_select ON public.bot_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) realtime.messages: explicitly scope guild-related topics to guild members
DROP POLICY IF EXISTS rt_topic_scoped ON realtime.messages;
CREATE POLICY rt_topic_scoped ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR realtime.topic() LIKE '%' || auth.uid()::text
      OR realtime.topic() LIKE '%' || auth.uid()::text || ':%'
      OR realtime.topic() = 'public:chat_messages'
      OR realtime.topic() LIKE 'empire-seats-%'
      OR EXISTS (
        SELECT 1 FROM public.support_threads st
        WHERE realtime.topic() = 'support:' || st.id::text
          AND st.user_id = auth.uid()
      )
      -- Guild-scoped topics: only members of that guild may subscribe
      OR (
        realtime.topic() LIKE 'guild-%'
        AND realtime.topic() <> 'guild-activity-live'
        AND EXISTS (
          SELECT 1 FROM public.guild_members gm
          WHERE gm.user_id = auth.uid()
            AND gm.guild_id::text = substring(realtime.topic() FROM 7)
        )
      )
      -- Global guild activity ticker — public to authenticated users (no per-user data)
      OR realtime.topic() = 'guild-activity-live'
    )
  );