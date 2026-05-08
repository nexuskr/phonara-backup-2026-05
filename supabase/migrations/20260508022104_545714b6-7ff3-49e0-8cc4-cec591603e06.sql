
create or replace view public.uptime_pings_public as
  select id, checked_at, ok, http_status, latency_ms, indicator from public.uptime_pings;
grant select on public.uptime_pings_public to anon, authenticated;

create or replace view public.chaos_runs_public as
  select id, ran_at, total_probes, passed, failed, duration_ms, source from public.chaos_runs;
grant select on public.chaos_runs_public to anon, authenticated;

create or replace function public.public_trust_metrics()
returns jsonb language sql stable security invoker set search_path=public as $$
  select jsonb_build_object(
    'total_paid', coalesce(s.total_paid,0),
    'paid_30d', coalesce(s.paid_30d,0),
    'avg_settle_minutes', 0,
    'cron_uptime_7d', coalesce(s.cron_uptime_7d,0),
    'audit_pass_30d', coalesce(s.audit_pass_30d,0),
    'policy_pass_7d', coalesce(s.policy_pass_7d,0),
    'unack_anomalies', coalesce(s.unack_anomalies,0),
    'last_cron_at', null,
    'total_members', coalesce(s.total_members,0),
    'active_members_30d', coalesce(s.active_members_30d,0),
    'generated_at', coalesce(s.taken_at, now())
  )
  from (select * from public.trust_snapshots order by taken_at desc limit 1) s
$$;
grant execute on function public.public_trust_metrics() to anon, authenticated;

create or replace function public.public_uptime_summary()
returns jsonb language sql stable security invoker set search_path=public as $$
  with w24 as (select ok, latency_ms from public.uptime_pings_public where checked_at >= now() - interval '24 hours'),
       w7d as (select ok from public.uptime_pings_public where checked_at >= now() - interval '7 days'),
       l as (select checked_at, ok from public.uptime_pings_public order by checked_at desc limit 1)
  select jsonb_build_object(
    'samples_24h', (select count(*) from w24),
    'success_rate_24h', coalesce((select round(100.0*avg(case when ok then 1 else 0 end),2) from w24),0),
    'success_rate_7d', coalesce((select round(100.0*avg(case when ok then 1 else 0 end),2) from w7d),0),
    'p95_latency_ms_24h', coalesce((select percentile_disc(0.95) within group (order by latency_ms) from w24 where latency_ms is not null)::int,0),
    'avg_latency_ms_24h', coalesce((select round(avg(latency_ms))::int from w24 where latency_ms is not null),0),
    'last_ping_at', (select checked_at from l),
    'last_ok', (select ok from l),
    'generated_at', now()
  )
$$;
grant execute on function public.public_uptime_summary() to anon, authenticated;

create or replace function public.public_uptime_heatmap_90d()
returns jsonb language sql stable security invoker set search_path=public as $$
  with days as (select generate_series(date_trunc('day', now() - interval '89 days'), date_trunc('day', now()), interval '1 day') as d),
       agg as (select date_trunc('day', checked_at) as d, count(*) as samples,
              round(100.0*avg(case when ok then 1 else 0 end),2) as success_rate
              from public.uptime_pings_public where checked_at >= now() - interval '90 days' group by 1)
  select jsonb_build_object('days', coalesce(jsonb_agg(jsonb_build_object(
    'date', to_char(d.d,'YYYY-MM-DD'),
    'samples', coalesce(a.samples,0),
    'success_rate', a.success_rate) order by d.d), '[]'::jsonb))
  from days d left join agg a on a.d=d.d
$$;
grant execute on function public.public_uptime_heatmap_90d() to anon, authenticated;

create or replace function public.latest_chaos_run()
returns jsonb language sql stable security invoker set search_path=public as $$
  select case when r.id is null then null::jsonb else jsonb_build_object(
    'ran_at', r.ran_at, 'total_probes', r.total_probes, 'passed', r.passed,
    'failed', r.failed, 'duration_ms', r.duration_ms,
    'pass_rate', case when r.total_probes>0 then round(100.0*r.passed/r.total_probes,1) end,
    'source', r.source) end
  from (select * from public.chaos_runs_public order by ran_at desc limit 1) r
$$;
grant execute on function public.latest_chaos_run() to anon, authenticated;

create or replace function public.trust_record_snapshot()
returns uuid language plpgsql security definer set search_path=public as $$
declare _id uuid; _total_paid bigint:=0; _paid_30d bigint:=0;
  _cron_uptime numeric:=0; _audit_pass numeric:=0; _policy_pass numeric:=0;
  _u24 numeric:=0; _u7 numeric:=0; _u_p95 integer:=0;
  _unack integer:=0; _members integer:=0; _active30 integer:=0;
begin
  select coalesce(sum(amount),0) into _total_paid from public.transactions
    where direction='credit' and kind in ('package_settle','mission_win','profit_share','jackpot_win');
  select coalesce(sum(amount),0) into _paid_30d from public.transactions
    where direction='credit' and kind in ('package_settle','mission_win','profit_share','jackpot_win')
    and created_at >= now() - interval '30 days';
  select case when count(*)=0 then 100 else round(100.0*sum(case when ok then 1 else 0 end)/count(*),2) end
    into _cron_uptime from public.cron_settle_audit_log where created_at >= now() - interval '7 days';
  select case when count(*)=0 then 100 else round(100.0*sum(case when ok then 1 else 0 end)/count(*),2) end
    into _audit_pass from public.security_audit_log where created_at >= now() - interval '30 days';
  select case when count(*)=0 then 100 else round(100.0*sum(case when passed then 1 else 0 end)/count(*),2) end
    into _policy_pass from public.policy_assertion_runs where created_at >= now() - interval '7 days';
  select coalesce(round(100.0*avg(case when ok then 1 else 0 end),2),0) into _u24
    from public.uptime_pings where checked_at >= now() - interval '24 hours';
  select coalesce(round(100.0*avg(case when ok then 1 else 0 end),2),0) into _u7
    from public.uptime_pings where checked_at >= now() - interval '7 days';
  select coalesce(percentile_disc(0.95) within group (order by latency_ms),0)::int into _u_p95
    from public.uptime_pings where checked_at >= now() - interval '24 hours' and latency_ms is not null;
  select count(*) into _unack from public.anomaly_events where acknowledged=false;
  select count(*) into _members from public.profiles;
  select count(distinct user_id) into _active30 from public.transactions where created_at >= now() - interval '30 days';
  insert into public.trust_snapshots (total_paid, paid_30d, cron_uptime_7d, audit_pass_30d, policy_pass_7d,
    uptime_success_24h, uptime_success_7d, uptime_p95_ms_24h, unack_anomalies, total_members, active_members_30d)
  values (_total_paid, _paid_30d, _cron_uptime, _audit_pass, _policy_pass, _u24, _u7, _u_p95, _unack, _members, _active30)
  returning id into _id;
  delete from public.trust_snapshots where taken_at < now() - interval '180 days';
  return _id;
end; $$;
revoke all on function public.trust_record_snapshot() from public, anon, authenticated;
grant execute on function public.trust_record_snapshot() to service_role;
select public.trust_record_snapshot();
