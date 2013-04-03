#!/bin/sh
#
# crop+resize images using ImageMagick

src="$1"
dst="$2"
maxw="$3"
maxh="$4"

identify -format "%w %h" "$src" | while read w h; do
    crop="${src/%jpg/crop}"
    if [ -e "$crop" ]; then
	read top right bottom left < "$crop"
	args="-crop $(($w-$left-$right))x$(($h-$top-$bottom))+$left+$top"
    fi
    if [ -n "$args" -o $w -gt $maxw -o $h -gt $maxh ]; then
	convert "$src" $args -resize "${maxw}x${maxh}>" "$dst"
    else
	cp "$src" "$dst"
    fi
done
