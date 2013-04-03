#!/bin/sh
#
# Make stagestosaturn.epub

cd "$(dirname $0)"

rm -f stagestosaturn.epub

cp stylesheet.css OEBPS/

for img in cover.jpg p*.jpg; do
    ./resize.sh "$img" "OEBPS/$img" 768 1024
done

zip -X stagestosaturn.epub mimetype
zip -rg stagestosaturn.epub META-INF OEBPS -x \*~ \*.DS_Store \*.gitignore
