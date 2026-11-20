#!/usr/bin/env python3
"""Build a standalone preview from the same files served by the website."""
import argparse
import re
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path, help='Path to the standalone HTML file')
args = parser.parse_args()

public = Path(__file__).resolve().parent / 'public'
html = (public / 'index.html').read_text(encoding='utf-8')
assets = [
    ('styles.css', '<link rel="stylesheet" href="/styles.css">', '<style>', '</style>'),
    *[(name, f'<script src="/{name}"></script>', '<script>', '</script>')
      for name in ('seed-reviews.js', 'movie-catalog.js', 'poster-manifest.js', 'content-evidence.js', 'family-advisories.js')],
    ('app.js', '<script type="module" src="/app.js"></script>', '<script type="module">', '</script>'),
]
for name, tag, start, end in assets:
    contents = (public / name).read_text(encoding='utf-8')
    if html.count(tag) != 1 or re.search(re.escape(end), contents, flags=re.IGNORECASE):
        raise ValueError(f'Cannot safely inline {name}')
    html = html.replace(tag, f'{start}{contents}{end}')

args.output.write_text(html, encoding='utf-8')
print(f'Wrote {args.output} ({len(html.encode("utf-8")):,} bytes)')
