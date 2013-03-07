#!/usr/bin/env python
#
# Diff the words of two files, ignoring whitespace.
# Get words from a web page with
# javascript:alert(document.body.textContent.replace(/\s/g, ' '))

import difflib
import sys

def getwords(path):
    return open(path, 'r').read().split()

a = getwords(sys.argv[1])
b = getwords(sys.argv[2])

diff = difflib.unified_diff(a, b, lineterm='',
                            fromfile=sys.argv[1],
                            tofile=sys.argv[2])
for line in diff:
    print line
