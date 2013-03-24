#!/bin/sh
#
# Make stagestosaturn.epub

cd "$(dirname $0)"

rm -f stagestosaturn.epub

cp stylesheet.css OEBPS/

# resize large images; copy the small ones
WIDTH=768
HEIGHT=1024
identify -format "%f %w %h\n" cover.jpg p*.jpg | grep jpg | while read src w h; do
    dst="OEBPS/$src"
    if [ $w -gt $WIDTH -o $h -gt $HEIGHT ]; then
	convert $src -resize "${WIDTH}x${HEIGHT}" $dst
    else
	cp $src $dst
    fi
done

zip -X stagestosaturn.epub mimetype
zip -rg stagestosaturn.epub META-INF OEBPS -x \*~ \*.DS_Store \*.gitignore
