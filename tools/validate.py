"""Validate package structure, examples and documentation links; no dependencies."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
hacs = json.loads((root / 'hacs.json').read_text(encoding='utf-8'))
assert hacs['filename'] == 'anma-card.js' and hacs['content_in_root'] is True
assert (root / hacs['filename']).stat().st_size > 100000
dashboard = json.loads((root / 'examples/three-tab-dashboard.yaml').read_text(encoding='utf-8'))
assert len(dashboard['views']) == 3
for view in dashboard['views']:
    assert view['type'] == 'panel'
    card = view['cards'][0]
    assert card['type'] == 'custom:anma-card'
    layout = card['layout']
    assert len(layout['powerFlow']['strings']) == 8
    assert len(layout['powerFlow']['batteries']) == 1
    assert layout['language'] == 'en'
    assert not layout['devices'] and not layout['batteryStack']
for file in root.rglob('*.md'):
    for target in re.findall(r'\]\(([^)]+)\)', file.read_text(encoding='utf-8')):
        if '://' not in target and not target.startswith('#'):
            assert (file.parent / target.split('#')[0]).exists(), (file, target)
for file in (root / 'examples').glob('*.yaml'):
    text = file.read_text(encoding='utf-8')
    assert not re.search(r'100\.11[14]\.|192\.168\.|access_token|password|Pivdenne', text, re.I)
print('PASS: HACS structure, three views, 8 PV groups, 1 battery, English examples, local documentation links and private-address checks.')
