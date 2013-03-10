#!/bin/sh
#
# Make stagestosaturn.epub

rm -f stagestosaturn.epub
zip -X stagestosaturn.epub mimetype
zip -rg stagestosaturn.epub META-INF OEBPS -x \*~ \*.DS_Store \*.gitignore
