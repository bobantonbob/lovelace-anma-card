"""Rebuild the standalone card from the included platform source snapshot."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / 'src'
card = (src / 'anma-card.js').read_text(encoding='utf-8')
start = card.index('/* ANMA Energy Station:')
marker = "})(typeof window !== 'undefined' ? window : globalThis);"
end = card.index(marker, start) + len(marker)
shared = '\n'.join((src / name).read_text(encoding='utf-8') for name in ('energy-station.js', 'power-flow.js', 'model.js'))
shared = '\n'.join(line.rstrip() for line in shared.splitlines())
(root / 'anma-card.js').write_bytes((card[:start] + shared.rstrip() + card[end:]).encode('utf-8'))
print('Built anma-card.js')
