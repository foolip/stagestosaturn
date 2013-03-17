#!/usr/bin/env python

import re
import sys

# exclude the most common dashed words
excludes = [
    '000-newton',
    '000-pound',
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

    anchor = None
    for i in range(len(lines)):
        line = lines[i]

        anchors = re.findall(r'NAME="([^"]+)"', line)
        if anchors:
            anchor = anchors[-1]

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
            # show one line of context and highlight the dashed word
            if i > 0:
                sys.stdout.write(lines[i-1])
            start = k
            end = k+1
            while (start > 0 and line[start-1].isalnum()):
                start -= 1
            while(end < len(line) and line[end].isalnum()):
                end += 1
            sys.stdout.write(line[:start] + '\033[91m' +
                             line[start:end] + '\033[0m' + line[end:])
            if i+1 < len(lines):
                sys.stdout.write(lines[i+1])
            # show the anchor (page) for context
            sys.stdout.write('[' + (anchor or '?') + '] ')
            # ask for a replacement
            choice = None
            while choice is None:
                raw = raw_input('Replace with mdash (m), ndash (n),' +
                                ' or skip (default): ')
                choice = { 'm': '&mdash;',
                           'n': '&ndash;',
                           '': '-' }.get(raw)
            choices[k] = choice
            sys.stdout.write('\n')

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
