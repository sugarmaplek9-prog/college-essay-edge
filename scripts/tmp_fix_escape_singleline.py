from pathlib import Path
p=Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
t=p.read_text(encoding='utf-8')
t=t.replace("return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');","return value.replace(/[.*+?^${}()|[\\\\]\\\\\\\\]/g, '\\\\\\$&');")
t=t.replace("return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');","return value.replace(/[.*+?^${}()|[\\\\]\\\\\\\\]/g, '\\\\\\$&');")
t=t.replace("return value.replace(/[.*+?^${}()|[\]\]/g, '\$&');","return value.replace(/[.*+?^${}()|[\\\\]\\\\\\\\]/g, '\\\\\\$&');")
p.write_text(t,encoding='utf-8')
print('ok')
