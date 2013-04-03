#!/bin/sh
#
# Generate a document with before/after images

cd "$(dirname $0)"

COMMIT=d9a9b281fceffdf669385306ec6d8d9480f40883
DIR=images

rm -rf $DIR
mkdir $DIR

cat > $DIR/images.htm <<EOF
<!doctype html>
<title>Stages to Saturn: old vs new images</title>
<script>
window.addEventListener('load', function() {
    function forEach(list, func) {
        Array.prototype.forEach.call(list, func);
    }

    function setTitle(img) {
        img.title = img.src.substr(img.src.lastIndexOf('/') + 1) + ' ' +
                    img.naturalWidth + '\u00D7' + img.naturalHeight;
    }

    forEach(document.querySelectorAll('.figure'), function(fig) {
        var table = document.createElement('table');
        var tr = document.createElement('tr');
        var tdOld = document.createElement('td');
        var tdNew = document.createElement('td');
        forEach(fig.querySelectorAll('img'), function(imgOld) {
            var imgNew = imgOld.cloneNode();
            imgOld.addEventListener('load', function() {
                imgNew.height = imgOld.naturalHeight;
                setTitle(imgOld);
            });
            imgNew.addEventListener('load', function() {
                fig.classList.add('done');
                setTitle(imgNew);
            });
            imgOld.src = imgOld.src.replace('.jpg', '.old.jpg');
            imgNew.src = imgNew.src.replace('.jpg', '.new.jpg');
            tdOld.appendChild(imgOld);
            tdNew.appendChild(imgNew);
        });
        tr.appendChild(tdOld);
        tr.appendChild(tdNew);
        table.appendChild(tr);
        fig.insertBefore(table, fig.firstChild);
    });
});
</script>
<style>
body { margin: 1em; }
.figure { padding: 1em 0; border-top: 1px solid black; }
/*.figure.done { display: none; }*/
.figure img { display: inline-block; max-height: 300px; }
.caption { margin: 0.1em 0 0 0; font-style: italic }
</style>
<h1>Stages to Saturn: old vs new images</h1>
EOF

awk '/<DIV CLASS="figure"/, /^<\/DIV/' \
    ch{1,2,3,4,5,6,7,8,9,10,11,12,13}.htm >> $DIR/images.htm

for img in p*.jpg; do
    git show $COMMIT:$img > "$DIR/${img%.jpg}.old.jpg"
done

git diff --name-only $COMMIT -- p*.jpg | while read img; do
    ./resize.sh $img "$DIR/${img%.jpg}.new.jpg" 3000 3000
done
