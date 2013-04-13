#!/bin/sh
#
# Make stagestosaturn.epub

cd "$(dirname $0)"

rm -f stagestosaturn.epub

cp stylesheet.css OEBPS/

sed "s/REVISION/$(git rev-parse HEAD)/g" about.htm > OEBPS/about.htm

for img in cover.jpg back.jpg p*.jpg; do
    echo "resizing: $img"
    ./resize.sh "$img" "OEBPS/$img" 768 1024
done

zip -X stagestosaturn.epub mimetype
zip -rg stagestosaturn.epub META-INF OEBPS -x \*~ \*.DS_Store \*.gitignore
