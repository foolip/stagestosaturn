#!/bin/sh
#
# Make stagestosaturn.epub

cd "$(dirname $0)"

rm -f stagestosaturn.epub

if [ ! -e OEBPS/main.html ]; then
    echo "main.html is missing"
    exit 1
fi

cp cover.jpg stylesheet.css p*.jpg OEBPS/
zip -X stagestosaturn.epub mimetype
zip -rg stagestosaturn.epub META-INF OEBPS -x \*~ \*.DS_Store \*.gitignore
