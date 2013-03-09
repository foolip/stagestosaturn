/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */

function assert(cond, msg) {
    if (!cond) {
        if (!msg) {
            msg = 'failed assert';
        }
        alert(msg);
        throw msg;
    }
}

function forEach(list, func) {
    Array.prototype.forEach.call(list, func);
}

function moveChildren(from, to) {
    while (from.firstChild) {
        to.appendChild(from.firstChild);
    }
}

function remove(elm) {
    elm.parentNode.removeChild(elm);
}

function replace(oldElm, newElm) {
    oldElm.parentNode.replaceChild(newElm, oldElm);
}

function sanitize(doc) {
    function isSpace(text) {
        return /^\s*$/.test(text);
    }

    function all(selector) {
        return doc.querySelectorAll(selector);
    }

    function first(selector) {
        return doc.querySelector(selector);
    }

    function removeAttributes(elmName, attrNames) {
        forEach(all(elmName), function(elm) {
            forEach(attrNames, function(attrName) {
                elm.removeAttribute(attrName);
            });
        });
    }

    function replaceWithChildren(elm) {
        // replace element with its children
        while (elm.firstChild) {
            elm.parentNode.insertBefore(elm.firstChild, elm);
        }
        remove(elm);
    }

    function mark(elm, color) {
        elm.style.border = '3px dotted ' + color;
    }

    // <x-sas-window> contains everything in <body>
    replaceWithChildren(first('x-sas-window'));

    // remove header and footer
    remove(first('dl'));
    remove(first('body > center:last-of-type'));

    // move <table> out of <p> (quirks mode doesn't)
    forEach(all('p > table'), function(table) {
        //mark(table.parentNode, 'pink');
        replace(table.parentNode, table);
    });

    // remove <font> elements
    forEach(all('font'), function(font) {
        if (font.face && font.attributes.length == 1) {
            replaceWithChildren(font);
        } else if (font.color == '#FFFFFF') {
            remove(font);
        } else {
            assert(false, 'death to ' + font.outerHTML);
        }
    });

    // remove empty elements (reverse order to get them all)
    var candidates = [];
    forEach(all('b, i, center, p, sub, sup'), function(elm) {
        candidates.push(elm);
    });
    candidates.reverse();
    forEach(candidates, function(elm) {
        if (!elm.children.length && isSpace(elm.textContent)) {
            //mark(elm, 'blue');
            remove(elm);
        }
    });

    // remove useless formatting
    forEach(all('b, i, sub, sup'), function(elm) {
        if (isSpace(elm.textContent)) {
            replaceWithChildren(elm);
        }
    });

    // remove obsolete/invalid attributes
    removeAttributes('body', ['bgcolor']);
    removeAttributes('hr', ['noshade', 'size', 'width']);
    removeAttributes('img', ['align', 'x-sas-useimageheight',
                             'x-sas-useimagewidth']);
    removeAttributes('p', ['align']); // FIXME
    removeAttributes('table', ['border', 'cellpadding',
                               'cellspacing', 'summary']);
    removeAttributes('td', ['height', 'valign', 'width']);

    // convert <b><hr> to just <hr>
    forEach(all('b > hr'), function(hr) {
        var b = hr.parentNode;
        if (isSpace(b.textContent)) {
            replace(b, hr);
        }
    });

    // convert <body><center><b> to <h1>
    forEach(all('body > center > b:first-child'), function(b) {
        var center = b.parentNode;
        if (center.firstChild != b || b.children.length ||
            center.textContent.trim() != b.textContent.trim()) {
            return;
        }
        var h1 = doc.createElement('h1');
        moveChildren(b, h1);
        replace(center, h1);
    });

    // merge adjacent <center> elements
    forEach(all('body > center + center'), function(second) {
        var first = second.previousSibling;
        while (first.tagName != 'CENTER') {
            first = first.previousSibling;
        }
        assert(first.tagName == 'CENTER');
        moveChildren(second, first);
        remove(second);
    });

    // convert <center><hr>...<hr></center> to <aside>
    forEach(all('body > center > hr:last-child'), function(hr2) {
        var center = hr2.parentNode;
        var hr1 = center.children[0];
        if (hr1.tagName != 'HR') {
            alert(center.outerHTML);
        }
        assert (hr1.tagName == 'HR');
        remove(center); return; // FIXME
        remove(hr1);
        remove(hr2);
        var aside = doc.createElement('aside');
        moveChildren(center, aside);
        replace(center, aside);
    });

    // convert [<a name="12"></a><b>12</b>] to
    // <span class="newpage" id="12"></span>
    forEach(all('a[name]'), function(a) {
        // exclude the inline chapter notes
        if (a.name == 'n1' || a.name == 'n2') {
            return;
        }

        var b = a.nextSibling;
        var prevText = a.previousSibling;
        var nextText = b.nextSibling;

        assert(b.tagName == 'B');
        assert(prevText.data[prevText.data.length - 1] == '[');
        assert(nextText.data[0] == ']');

        prevText.data = prevText.data.substr(0, prevText.data.length - 1);
        nextText.data = nextText.data.substr(1);

        var span = doc.createElement('span');
        span.className = 'newpage';
        span.id = a.name;

        replace(a, span);
        remove(b);
    });
}

window.addEventListener('load', function() {
    // replace iframes with their sanitized content
    forEach(document.querySelectorAll('iframe'), function(iframe) {
        sanitize(iframe.contentDocument);
        moveChildren(iframe.contentDocument.body, document.body);
        remove(iframe);
    });

    // sanitize whitespace a bit (broken because of adjacent text nodes)
    document.body.normalize();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
                                           null, false);
    while (walker.nextNode()) {
        var node = walker.currentNode;
        node.data = node.data.replace(/\s{2,}/g, '\n');
    }

    // serialize this document
    remove(document.querySelector('script'));
    //var xml = new XMLSerializer().serializeToString(document);
    //xml = html.replace(/.*<html>/, '<!doctype html>\n<html>');
    var html = '<!doctype html>' + document.documentElement.outerHTML;
    alert(html);
});
