"""Validate package structure, examples and documentation links; no dependencies."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
hacs = json.loads((root / 'hacs.json').read_text(encoding='utf-8'))
assert hacs['filename'] == 'anma-card.js' and hacs['content_in_root'] is True
assert (root / hacs['filename']).stat().st_size > 100000
bundle = (root / hacs['filename']).read_text(encoding='utf-8')
assert "const CARD_VERSION = '0.7.5'" in bundle
assert "'data:image/webp;base64," in bundle
assert "'__ANMA_CLOUD_ATLAS__'" not in bundle
assert "'__ANMA_CLOUD_EV__'" not in bundle
for suffix in ['', '-phone']:
    assert (root / 'docs/images' / ('cloud-flow' + suffix + '-071.png')).is_file()
for view in ['energy-station', 'power-flow', 'cloud-flow', 'overview', 'compact', 'full']:
    for suffix in ['', '-phone']:
        assert (root / 'docs/images' / (view + suffix + '-070.png')).is_file()
cloud = json.loads((root / 'examples/cloud-flow-card.yaml').read_text(encoding='utf-8'))
assert cloud['type'] == 'custom:anma-card'
assert cloud['layout']['powerFlow']['cloud']['forecastEntity'].startswith('weather.')
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
print('PASS: HACS structure, 0.7.5 embedded assets, 12 gallery captures, cloud weather example, three-view example, documentation links and private-address checks.')
