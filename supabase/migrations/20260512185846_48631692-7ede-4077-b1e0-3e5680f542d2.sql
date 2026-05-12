create or replace function public.get_whale_strikes_24h(_limit int default 30)
returns jsonb language sql stable security definer set search_path = public as $$
  with crown_top as (
    select
      'crown'::text as kind,
      ce.created_at,
      ce.awarded_amount::bigint as amount,
      ce.event_type as label,
      ce.user_id
    from public.crown_events ce
    where ce.created_at >= now() - interval '24 hours'
      and ce.awarded_amount >= 5000
    order by ce.awarded_amount desc
    limit greatest(_limit, 10)
  ),
  baron as (
    select
      'baron'::text as kind,
      fn.created_at,
      0::bigint as amount,
      coalesce(fn.kind, 'baron_promotion') as label,
      fn.user_id
    from public.fomo_notifications fn
    where fn.created_at >= now() - interval '24 hours'
      and fn.kind in ('baron_promotion','empire_level_up')
    order by fn.created_at desc
    limit greatest(_limit, 10)
  ),
  wd as (
    select
      'withdraw'::text as kind,
      wr.completed_at as created_at,
      wr.amount::bigint as amount,
      'withdrawal'::text as label,
      wr.user_id
    from public.withdrawal_requests wr
    where wr.status = 'completed'
      and wr.completed_at >= now() - interval '24 hours'
      and wr.amount >= 100000
    order by wr.amount desc
    limit greatest(_limit, 10)
  ),
  unioned as (
    select * from crown_top
    union all select * from baron
    union all select * from wd
  ),
  ranked as (
    select
      u.kind,
      u.created_at,
      u.amount,
      u.label,
      coalesce(p.nickname, '익명의 영주') as nick
    from unioned u
    left join public.profiles p on p.id = u.user_id
    order by u.created_at desc
    limit greatest(_limit, 1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'kind', kind,
    'created_at', created_at,
    'amount', amount,
    'label', label,
    'nick', case
      when length(nick) <= 2 then left(nick,1) || '*'
      else left(nick,1) || repeat('*', greatest(length(nick)-2,1)) || right(nick,1)
    end
  ) order by created_at desc), '[]'::jsonb)
  from ranked;
$$;
revoke all on function public.get_whale_strikes_24h(int) from public;
grant execute on function public.get_whale_strikes_24h(int) to anon, authenticated;

insert into public.function_permissions_baseline (function_name, function_args, allowed_roles, category, note)
values ('get_whale_strikes_24h', '_limit integer', array['anon','authenticated'], 'public_read', 'Public whale strike FOMO feed (masked)')
on conflict (function_name, function_args) do update
set allowed_roles = excluded.allowed_roles, category = excluded.category, note = excluded.note, updated_at = now();