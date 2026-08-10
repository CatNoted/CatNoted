import os
import re

def check_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # match className="...", className='...', className={`...`}
    # we need to be careful with template literals that might have newlines or expressions

    matches = re.finditer(r'className\s*=\s*(["\'])(.*?)\1', content)
    for match in matches:
        cls = match.group(2)
        tokens = set(cls.split())
        if 'flex' in tokens and 'truncate' in tokens:
            print(f"[{path}] flex + truncate: {cls}")

    matches2 = re.finditer(r'className\s*=\s*\{`([^`]+)`\}', content)
    for match in matches2:
        cls = match.group(1)
        tokens = set(cls.split())
        if 'flex' in tokens and 'truncate' in tokens:
            print(f"[{path}] flex + truncate (template): {cls}")

for root, _, files in os.walk('.'):
    if any(ignore in root for ignore in ['node_modules', '.git', 'dist']):
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            check_file(os.path.join(root, file))
