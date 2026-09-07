insert into companies (id, ticker, name, sector, status) values
('c1','NVDA','NVIDIA Corporation','Semiconductors','active'),
('c2','MSFT','Microsoft Corporation','Software & Cloud','monitoring'),
('c3','JPM','JPMorgan Chase & Co.','Financial Services','active'),
('c4','NEE','NextEra Energy','Utilities','paused'),
('c5','LLY','Eli Lilly and Company','Healthcare','active'),
('c6','PLTR','Palantir Technologies','Software & Data','monitoring')
on conflict (id) do update set ticker=excluded.ticker, name=excluded.name, sector=excluded.sector, status=excluded.status;

insert into triggers (id, company_id, type, detected_at, severity, summary) values
('t1','c1','Earnings revision','2026-09-05T08:42:00Z','high','Consensus FY27 EPS estimate moved +8.4% after channel check.'),
('t2','c3','Credit spread','2026-09-05T07:58:00Z','medium','Senior debt spread widened 14 bps versus financials basket.'),
('t3','c2','Regulatory filing','2026-09-04T16:24:00Z','low','New AI infrastructure capex disclosure in 10-Q amendment.'),
('t4','c4','Data quality','2026-09-04T14:11:00Z','critical','Fundamental feed delayed; automated scoring paused.'),
('t5','c6','Volume anomaly','2026-09-03T12:05:00Z','high','Unusual options volume detected ahead of investor update.'),
('t6','c5','No new signal','2026-09-02T09:00:00Z','low','Scheduled monitoring run completed without an escalation.')
on conflict (id) do update set company_id=excluded.company_id, type=excluded.type, detected_at=excluded.detected_at, severity=excluded.severity, summary=excluded.summary;

insert into agent_decisions (id, trigger_id, action, priority, rationale, created_at) values
('d1','t1','Queue SKORE rerun','P1','Material estimate revision exceeds configured threshold.','2026-09-05T08:44:00Z'),
('d2','t2','Queue monitoring run','P2','Spread move is notable but below escalation threshold.','2026-09-05T08:00:00Z'),
('d3','t4','Pause workflow','P0','Do not score stale fundamentals.','2026-09-04T14:12:00Z'),
('d4','t5','Escalate to analyst','P1','Options activity requires a source and catalyst review.','2026-09-03T12:07:00Z'),
('d5','t6','Close trigger','P3','No material change detected in the scheduled run.','2026-09-02T09:01:00Z')
on conflict (id) do update set trigger_id=excluded.trigger_id, action=excluded.action, priority=excluded.priority, rationale=excluded.rationale, created_at=excluded.created_at;

insert into skore_jobs (id, company_id, status, queued_at, started_at, completed_at, error, score, factors) values
('job-1042','c1','started','2026-09-05T08:45:00Z','2026-09-05T08:46:00Z',null,null,87,'[{"name":"Earnings momentum","impact":14,"weight":0.3},{"name":"Valuation","impact":-4,"weight":0.25},{"name":"Market structure","impact":9,"weight":0.2}]'),
('job-1041','c3','queued','2026-09-05T08:01:00Z',null,null,null,null,'[{"name":"Credit quality","impact":-8,"weight":0.35}]'),
('job-1040','c2','completed','2026-09-04T16:26:00Z','2026-09-04T16:27:00Z','2026-09-04T16:31:00Z',null,74,'[{"name":"Cloud growth","impact":11,"weight":0.35},{"name":"AI capex","impact":-6,"weight":0.25}]'),
('job-1039','c4','failed','2026-09-04T14:12:00Z','2026-09-04T14:13:00Z',null,'Fundamental feed unavailable after 3 retries.',null,'[]'),
('job-1038','c5','completed','2026-09-03T11:20:00Z','2026-09-03T11:21:00Z','2026-09-03T11:26:00Z',null,91,'[{"name":"Earnings momentum","impact":18,"weight":0.35},{"name":"Pipeline","impact":14,"weight":0.3}]'),
('job-1037','c6','failed','2026-09-03T12:08:00Z','2026-09-03T12:09:00Z',null,'Market data provider timed out after 3 retries.',null,'[]')
on conflict (id) do update set company_id=excluded.company_id, status=excluded.status, queued_at=excluded.queued_at, started_at=excluded.started_at, completed_at=excluded.completed_at, error=excluded.error, score=excluded.score, factors=excluded.factors;

insert into reports (id, company_id, score, factors, generated_at, report_url) values
('r1','c2',74,'[{"name":"Cloud growth","impact":11,"weight":0.35}]','2026-09-04T16:31:00Z','/reports/r1'),
('r2','c5',91,'[{"name":"Earnings momentum","impact":18,"weight":0.35}]','2026-09-03T11:26:00Z','/reports/r2'),
('r3','c1',82,'[{"name":"Earnings momentum","impact":14,"weight":0.3}]','2026-09-01T10:04:00Z','/reports/r3'),
('r4','c6',63,'[{"name":"Volume signal","impact":-12,"weight":0.3}]','2026-08-30T15:10:00Z',null)
on conflict (id) do update set company_id=excluded.company_id, score=excluded.score, factors=excluded.factors, generated_at=excluded.generated_at, report_url=excluded.report_url;

insert into research_briefs (company_id, summary, why_it_matters, affected_factors, watch_next, evidence) values
('c2','Microsoft disclosed higher AI infrastructure spending in its latest filing.','The disclosure may change near-term margin expectations and the balance between cloud growth and investment intensity.','[{"name":"Cloud growth","direction":"up"},{"name":"AI capex","direction":"down"}]','["Next earnings estimate revision","Cloud bookings versus capex growth","Confirmation in the next filing"]','["MSFT · regulatory filing trigger","SKORE score 74/100","WTFXAI internal monitoring feed"]'),
('c4','Scoring is paused because the fundamental feed is stale.','A stale input set makes the composite score unreliable and requires an operator decision before resuming.','[{"name":"Data quality","direction":"down"}]','["Feed recovery confirmation","Backfill completeness","Manual workflow restart"]','["NEE · data quality trigger","Failed job job-1039","WTFXAI internal monitoring feed"]'),
('c6','Palantir has an unusual options-volume signal ahead of an investor update.','The activity could indicate positioning around a catalyst, but it needs confirmation from underlying volume and company disclosures.','[{"name":"Volume signal","direction":"down"}]','["Investor update transcript","Underlying volume confirmation","Estimate revisions"]','["PLTR · volume anomaly trigger","Failed job job-1037","WTFXAI internal monitoring feed"]')
on conflict (company_id) do update set summary=excluded.summary, why_it_matters=excluded.why_it_matters, affected_factors=excluded.affected_factors, watch_next=excluded.watch_next, evidence=excluded.evidence;
