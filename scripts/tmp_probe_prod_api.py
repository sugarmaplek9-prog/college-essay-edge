import json
import urllib.request

CASES = {
    'HV2_03': 'I managed inventory for a weekend coffee kiosk fundraiser and still ran out of cups before noon. I thought the problem was volume, but when I reviewed receipts I saw we were overpouring because the cup stacks had mixed sizes. I rebuilt the prep system so volunteers checked size-color stickers before service and logged each refill. The next event sold more drinks with less waste. The embarrassing shortage turned into the first process I designed that other clubs asked to copy.',
    'HV2_08': 'A freshman with a nut allergy sat at our table and skipped lunch three days in a row because the labels were inconsistent. I reported it once and was told food service was already reviewing labels. Two weeks later nothing changed. I gathered photos of mislabeled trays, wrote a short memo, and asked the vice principal to walk the line with me before first lunch. New color-coded signs were posted that week. I stopped treating escalation like overreaction.',
    'HV2_11': 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.',
}

for case_id, raw in CASES.items():
    request = urllib.request.Request(
        'https://college-essay-edge.vercel.app/api/intake/session',
        data=json.dumps({'raw_input': raw}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.load(response)
    payload = {
        'case_id': case_id,
        'product_mode': data.get('product_mode'),
        'route': data.get('evidence_strength', {}).get('route'),
        'pattern': data.get('intake_intelligence', {}).get('narrative_pattern', {}).get('primary_pattern'),
        'pattern_reason_codes': data.get('intake_intelligence', {}).get('narrative_pattern', {}).get('reason_codes'),
        'viability': data.get('intake_intelligence', {}).get('recommendation_viability', {}).get('decision'),
        'blank_page_mode': data.get('blank_page_mode'),
        'top_level_blank_page_route': data.get('top_level_blank_page_route'),
        'displayed_recommendation': data.get('canonical_page3_payload', {}).get('recommendation_packet', {}).get('displayed_recommendation'),
    }
    print(json.dumps(payload, ensure_ascii=False))
