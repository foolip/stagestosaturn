#!/bin/sh
#
# Make stagestosaturn.epub

cd "$(dirname $0)"

rm -f stagestosaturn.epub
rm -f OEBPS/p*.jpg
cp p*.jpg OEBPS/
zip -X stagestosaturn.epub mimetype
zip -rg stagestosaturn.epub META-INF OEBPS -x \*~ \*.DS_Store \*.gitignore
