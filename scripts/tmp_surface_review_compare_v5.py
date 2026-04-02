#!/usr/bin/env python3
import json,re
BEFORE='evaluation_outputs/page3_controlled_testing_v1/ct24_source_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json'
AFTER='evaluation_outputs/page3_controlled_testing_v1/ct24_coach_quality_v4/CONTROLLED_TESTING_SUMMARY_V1.json'

def clean(v): return re.sub(r'\s+',' ',str(v or '')).strip()
def lower(v): return clean(v).lower()

def score_why(why):
    why=clean(why)
    if not why: return 1
    has_comp=bool(re.search(r'beats the weaker read|rather than|instead of|stronger',why,re.I))
    has_draft=bool(re.search(r'drafting payoff|start with|draft',why,re.I))
    truncated=bool(re.search(r'…|\.\.\.$',why))
    if has_comp and has_draft and not truncated: return 4
    if has_comp and has_draft: return 3
    if has_comp or has_draft: return 2
    return 1

def score_next(next_step):
    next_step=clean(next_step)
    if not next_step: return 1
    if re.search(r'open with|next step|write|draft|start',next_step,re.I): return 4
    return 2

def summarize(path):
    data=json.load(open(path))
    rows=data['rows']
    bs=data['batch_summary']
    fam={e['key']:e['count'] for e in bs['family_distribution']}
    top_shell=bs['top_semantic_shells'][0]
    templated=0; weak_sharp=0; weak_next=0; why_sum=0
    for row in rows:
        out=row.get('output') or {}
        rec=out.get('displayed_recommendation','')
        why=out.get('why_this_direction','')
        next_step=out.get('next_step','')
        temp=bool(re.search(r'^center your essay on',lower(rec))) or bool(re.search(r'^show how your understanding shifted',lower(rec))) or bool(re.search(r'the moment you changed your response after the moment you noticed',lower(rec)))
        why_score=score_why(why)
        next_score=score_next(next_step)
        sharp=why_score>=3 and next_score>=2 and not temp
        why_sum+=why_score
        if temp: templated+=1
        if not sharp: weak_sharp+=1
        if next_score<=2: weak_next+=1
    n=len(rows)
    return {
      'why_mean': round(why_sum/n,4),
      'weak_sharp': weak_sharp,
      'weak_next': weak_next,
      'top_shell_key': top_shell['key'],
      'top_shell_count': top_shell['count'],
      'top_shell_ratio': round(top_shell['count']/n,4),
      'templated_count': templated,
      'relationship_share': round(fam.get('relationship',0)/n,4),
    }
print(json.dumps({'before':summarize(BEFORE),'after':summarize(AFTER)},indent=2))
