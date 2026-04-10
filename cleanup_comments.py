#!/usr/bin/env python3
import os
import glob
import re

def remove_python_comments(content):
    lines = content.split('\n')
    result = []
    in_docstring = False
    docstring_char = None
    
    for line in lines:
        stripped = line.strip()
        
        if '"""' in line or "'''" in line:
            if not in_docstring:
                in_docstring = True
                docstring_char = '"""' if '"""' in line else "'''"
                continue
            elif docstring_char in line:
                in_docstring = False
                continue
        
        if in_docstring:
            continue
            
        if '#' in line and not stripped.startswith('#!/'):
            idx = line.index('#')
            if idx == 0 or line[idx-1] != '\\':
                line = line[:idx].rstrip()
        
        result.append(line)
    
    return '\n'.join(result)

def remove_typescript_comments(content):
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        if '//' in line:
            idx = line.index('//')
            if idx >= 0:
                line = line[:idx].rstrip()
        
        if '/*' in line:
            if '*/' in line:
                start = line.index('/*')
                end = line.index('*/', start)
                line = line[:start] + line[end+2:]
            else:
                start = line.index('/*')
                line = line[:start]
                i += 1
                while i < len(lines) and '*/' not in lines[i]:
                    i += 1
                if i < len(lines):
                    end_line = lines[i]
                    if '*/' in end_line:
                        line += end_line[end_line.index('*/')+2:]
                    i += 1
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

os.chdir('hea-proj-hccft')

py_files = glob.glob('backend/**/*.py', recursive=True)
for f in py_files:
    if os.path.isfile(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        cleaned = remove_python_comments(content)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(cleaned)
        print(f'Cleaned: {f}')

ts_files = []
for root, dirs, files in os.walk('frontend/auracare/src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            ts_files.append(os.path.join(root, file))

for f in ts_files:
    if os.path.isfile(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        cleaned = remove_typescript_comments(content)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(cleaned)
        print(f'Cleaned: {f}')

print(f'Successfully cleaned {len(py_files)} Python and {len(ts_files)} TypeScript files!')
