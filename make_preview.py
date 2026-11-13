from pathlib import Path
p=Path(__file__).parent
html=(p/'public/index.html').read_text()
css=(p/'public/styles.css').read_text()
html=html.replace('<link rel="stylesheet" href="/styles.css">',f'<style>{css}</style>')
for fn in ['seed-reviews.js','movie-catalog.js','poster-manifest.js']:
 html=html.replace(f'<script src="/{fn}"></script>',f'<script>{(p/"public"/fn).read_text()}</script>')
app=(p/'public/app.js').read_text()
html=html.replace('<script type="module" src="/app.js"></script>',f'<script type="module">{app}</script>')
(Path('/mnt/data/The_Orthodox_Lens_V12_Preview.html')).write_text(html)
print('preview chars',len(html))
