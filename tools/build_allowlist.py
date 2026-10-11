#!/usr/bin/env python3
"""Build the hashed NDA allowlist for PredictionMiniApp.dc.html.

Reads tools/nda-allowlist.txt (local, gitignored) and prints the HASHES array.
normalize() must stay identical to normalizeCompany() in PredictionMiniApp.dc.html.
"""
import hashlib, re, sys, unicodedata
from pathlib import Path

SALT = 'asya-portfolio/prediction-nda:'
SUFFIXES = {'ltd', 'llc', 'llp', 'inc', 'corp', 'corporation', 'company', 'co', 'limited',
            'plc', 'gmbh', 'ооо', 'оао', 'зао', 'пао', 'ао', 'ип', 'тоо'}

def normalize(s):
    s = unicodedata.normalize('NFKC', s).lower().replace('ё', 'е')
    s = re.sub(r'[«»"“”„\'’‘`,()]', ' ', s)
    tokens = [t for t in s.split() if re.sub(r'[.\-–—_]', '', t) not in SUFFIXES]
    return re.sub(r'[.\-–—_\s]', '', ''.join(tokens))

def digest(alias):
    return hashlib.sha256((SALT + normalize(alias)).encode('utf-8')).hexdigest()[:32]

def main():
    src = Path(__file__).with_name('nda-allowlist.txt')
    hashes = set()
    for line in src.read_text('utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or ':' not in line:
            continue
        name, aliases = line.split(':', 1)
        for a in [name] + aliases.split(','):
            if normalize(a):
                hashes.add(digest(a))
    if '--check' in sys.argv:
        for q in sys.argv[sys.argv.index('--check') + 1:]:
            print(f'{q!r:32} -> {normalize(q)!r:24} {"OK" if digest(q) in hashes else "no"}')
        return
    print('const HASHES = new Set([')
    items = sorted(hashes)
    for i in range(0, len(items), 3):
        print('  ' + ' '.join(f"'{h}'," for h in items[i:i + 3]))
    print(']);')

if __name__ == '__main__':
    main()
