#!/usr/bin/env python

import re
import sys

# exclude the most common dashed words
excludes = [
    'AS-201',
    'AS-204',
    'AS-501',
    'AS-502',
    'AS-503',
    'AS-506',
    'Apollo-Saturn',
    'Apollo-Soyuz',
    'B-377',
    'C-1',
    'C-1B',
    'C-2',
    'C-3',
    'C-5',
    'Dyna-Soar',
    'F-1',
    'H-1',
    'J-2',
    'Mercury-Redstone',
    'RL-10',
    'RP-1',
    'S-3D',
    'S-I',
    'S-IB',
    'S-IC',
    'S-II',
    'S-II-1',
    'S-II-T',
    'S-IV',
    'S-IVB',
    'S-V',
    'SA-1',
    'SA-10',
    'SA-4',
    'SA-5',
    'SA-6',
    'SA-7',
    'SP-4201',
    'SP-4205',
    'SP-4206',
    'ST-124',
    'V-2',
    'X-SAS-UseImageHeight',
    'X-SAS-UseImageWidth',
    'X-SAS-WINDOW']

def dashify(path):
    modified = False
    lines = [l for l in open(path, 'r')]

    for i in range(len(lines)):
        line = lines[i]
        if '-' not in line:
            #sys.stdout.write(line)
            continue

        # offsets of dashes and the replacement choices
        offsets = []
        choices = {}

        for m in re.finditer(r'\w*-[\w-]*', line):
            if m.group() in excludes:
                continue
            for j in range(m.start(), m.end()+1):
                if line[j] == '-':
                    offsets.append(j)

        if not offsets:
            #sys.stdout.write(line)
            continue

        for k in offsets:
            sys.stdout.write(line[:k] + '\033[91m-\033[0m' + line[k+1:])
            choice = None
            while choice is None:
                raw = raw_input('Replace with mdash (m), ndash (n),' +
                                ' or skip (default): ')
                choice = { 'm': '&mdash;',
                           'n': '&ndash;',
                           '': '-' }.get(raw)
            choices[k] = choice

        # rewrite line
        offsets.reverse()
        for k in offsets:
            line = line[:k] + choices[k] + line[k+1:]
        if line != lines[i]:
            #sys.stdout.write(line)
            lines[i] = line
            modified = True

    if modified:
        with open(path, 'w+') as f:
            for l in lines:
                f.write(l)

for path in sys.argv[1:]:
    dashify(path)
