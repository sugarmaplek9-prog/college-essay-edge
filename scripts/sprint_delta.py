import json

pre = json.load(open('/Volumes/TOSHIBA EXT/College Essay/evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1_PROD_POST_CANDIDATE_RECOVERY.json'))
post = json.load(open('/Volumes/TOSHIBA EXT/College Essay/evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1.json'))

def summarize(cases):
    routes = {}
    blocked = 0
    for c in cases:
        r = c.get('live_route', '?')
        routes[r] = routes.get(r, 0) + 1
        if c.get('live_route') == 'blocked':
            blocked += 1
    return routes, blocked

pre_r, pre_b = summarize(pre)
post_r, post_b = summarize(post)

print('=== PRE-SPRINT (POST_CANDIDATE_RECOVERY) ===')
print('Routes:', pre_r)
print('=== POST-SPRINT (CURRENT) ===')
print('Routes:', post_r)
print()
print(f'blocked:        {pre_b}  ->  {post_b}  (delta {post_b - pre_b:+d})')
print(f'clarification:  {pre_r.get("clarification",0)}  ->  {post_r.get("clarification",0)}  (delta {post_r.get("clarification",0) - pre_r.get("clarification",0):+d})')
print(f'direction_light:{pre_r.get("direction_light",0)}  ->  {post_r.get("direction_light",0)}  (delta {post_r.get("direction_light",0) - pre_r.get("direction_light",0):+d})')

pre_d = {c['case_id']: c.get('live_route') for c in pre}
post_d = {c['case_id']: c.get('live_route') for c in post}
print()
print('=== CONVERSIONS ===')
for cid in sorted(pre_d):
    if pre_d.get(cid) != post_d.get(cid):
        print(f'  {cid}: {pre_d.get(cid)} -> {post_d.get(cid)}')
print('(no change on other cases)')
