#!/usr/bin/env python3
"""Build the NDA allowlist for PredictionMiniApp.dc.html.

Reads tools/nda-allowlist.txt (local, gitignored) and prints the ACCESS map:
  key   = first 32 hex chars of SHA-256(SALT + normalized alias)
  value = the company's canonical name (the text before ':'), XOR-encrypted with a keystream
          derived from the normalized alias, so names can only be read by someone who types
          an allowed alias. The page sends that canonical name to analytics.
normalize() must stay identical to normalizeCompany() in PredictionMiniApp.dc.html,
and keystream() to nameKeystream() there.
"""
import hashlib, re, sys, unicodedata
from pathlib import Path

SALT = 'asya-portfolio/prediction-nda:'
NAME_SALT = 'asya-portfolio/prediction-nda/name:'
SUFFIXES = {'ltd', 'llc', 'llp', 'inc', 'corp', 'corporation', 'company', 'co', 'limited',
            'plc', 'gmbh', 'ооо', 'оао', 'зао', 'пао', 'ао', 'ип', 'тоо'}

def normalize(s):
    s = unicodedata.normalize('NFKC', s).lower().replace('ё', 'е')
    s = re.sub(r'[«»"“”„\'’‘`,()]', ' ', s)
    tokens = [t for t in s.split() if re.sub(r'[.\-–—_]', '', t) not in SUFFIXES]
    return re.sub(r'[.\-–—_\s]', '', ''.join(tokens))

def digest(alias):
    return hashlib.sha256((SALT + normalize(alias)).encode('utf-8')).hexdigest()[:32]

def keystream(key, n):
    out, i = b'', 0
    while len(out) < n:
        out += hashlib.sha256(f'{NAME_SALT}{key}:{i}'.encode('utf-8')).digest(); i += 1
    return out[:n]

def encrypt_name(name, alias):
    data = name.encode('utf-8')
    return bytes(a ^ b for a, b in zip(data, keystream(normalize(alias), len(data)))).hex()

def load():
    src = Path(__file__).with_name('nda-allowlist.txt')
    access, owner = {}, {}
    for line in src.read_text('utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or ':' not in line:
            continue
        name, aliases = (p.strip() for p in line.split(':', 1))
        for a in [name] + aliases.split(','):
            key = normalize(a)
            if not key:
                continue
            if key in owner and owner[key] != name:
                sys.exit(f'alias {a!r} belongs to both {owner[key]!r} and {name!r}')
            owner[key] = name
            access[digest(a)] = encrypt_name(name, a)
    return access, owner

def main():
    access, owner = load()
    if '--check' in sys.argv:
        for q in sys.argv[sys.argv.index('--check') + 1:]:
            print(f'{q!r:40} -> {owner.get(normalize(q), "no")}')
        return
    print('const ACCESS = new Map([')
    for k in sorted(access):
        print(f"  ['{k}', '{access[k]}'],")
    print(']);')

if __name__ == '__main__':
    main()
