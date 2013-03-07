#!/usr/bin/env python
#
# Rewrite (break) the HTML to be valid HTML 4.01 Transitional

import re
import sys

for path in sys.argv[1:]:
    def filter(line):
        if 'X-SAS-WINDOW' in line:
            return '<meta http-equiv="Content-Type" content="text/html; charset=US-ASCII">'
        if 'X-SAS-UseImage' in line:
            line = re.sub(r'X-SAS-UseImage(Width|Height) ?', '', line).rstrip()
        return line

    lines = [filter(l) for l in open(path, 'r').read().splitlines()]
    lines = ['<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"',
             '   "http://www.w3.org/TR/html4/loose.dtd">'] + lines + ['']
    html = '\r\n'.join(lines)
    html = re.sub('</?(FONT|CENTER|HR)[^>]*>', '', html)
    html = html.replace('</P>', '')
    open(path, 'w+').write(html)
