/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */

'use strict';

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
    removeAttributes('img', ['align', 'border',
                             'x-sas-useimageheight',
                             'x-sas-useimagewidth']);
    removeAttributes('table', ['border', 'cellpadding',
                               'cellspacing', 'summary']);
    removeAttributes('td', ['height', 'valign', 'width']);

    // convert subscript 2 to Unicode
    forEach(all('sub'), function(sub) {
        assert(sub.textContent == '2');
        replace(sub, doc.createTextNode('\u2082'));
    });

    // convert [<a name="12"></a><b>12</b>] to
    // <span class="page" id="12"></span>
    forEach(all('a[name]'), function(a) {
        if (/^\d+\.\d+$/.test(a.name)) {
            // looks like a note anchor
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
        span.className = 'page';
        span.id = a.name;
        span.textContent = ' '; // polyglot compat

        replace(a, span);
        remove(b);
    });

    // convert <b><sup><a href="#1.3">3</a></sup></b> to [3]
    forEach(all('b > sup > a[href]'), function(a) {
        a.textContent = '[' + a.textContent + ']';
        replace(a.parentNode.parentNode, a);
    });

    // rewrite IDs to please XML (cannot start with a digit)
    function xmlid(id) {
        if (/^\d+$/.test(id)) {
            // page reference
            return 'p' + id;
        } else if (/^\d+\.\d+$/.test(id)) {
            // note reference
            return 'n' + id;
        } else {
            assert(isNaN(parseInt(id)), id + ' is not a valid XML ID');
            return id;
        }
    }
    forEach(doc.querySelectorAll('[id]'), function(elm) {
        elm.id = xmlid(elm.id);
    });
    forEach(doc.querySelectorAll('a[href]'), function(a) {
        var parts = a.getAttribute('href').split('#');
        if (parts.length == 2) {
            parts[1] = xmlid(parts[1]);
        }
        a.setAttribute('href', parts.join('#'));
    });

    // give each figure an ID based on its (first) image
    forEach(all('.figure'), function(fig) {
        fig.id = fig.querySelector('img').getAttribute('src')
            .replace(/^p/, 'fig').replace(/\.jpg$/, '');
    });

    function quotify(elm) {
        // split text nodes to isolate " ` ' and collect into an array
        var walker = doc.createTreeWalker(elm, NodeFilter.SHOW_TEXT,
                                          null, false);
        var nodes = [];
        while (walker.nextNode()) {
            var node = walker.currentNode;
            nodes.push(node);
            if (node.data.length < 2) {
                continue;
            }
            var offset = node.data.search(/["`']/);
            if (offset == 0) {
                node.splitText(1);
            } else if (offset > 0 && offset < node.data.length) {
                node.splitText(offset);
            }
        }

        // make text nodes big and red (for debugging)
        function mark(node) {
            /*
            var span = doc.createElement('span');
            span.className = 'quote';
            replace(node, span);
            span.appendChild(node);
            */
        }

        // loop over the text nodes and make them pretty
        var ls = '\u2018';
        var rs = '\u2019';
        var ld = '\u201C';
        var rd = '\u201D';
        var opens = null; // opening single quote
        var opend = null; // opening double quote
        forEach(nodes, function(node, i) {
            var c = node.data;
            if (c.length != 1 || '"`\''.indexOf(c) == -1) {
                return;
            }

            // extract the characters before and after c
            var before = i > 0 ? nodes[i-1].data[nodes[i-1].data.length-1] : ' ';
            var after = i+1 < nodes.length ? nodes[i+1].data[0] : ' ';

            var wordBefore = /[\w.,;!?\u2019\u2026]/.test(before);
            var wordAfter = /[\w.\u2026]/.test(after);

            if (c == '"') {
                if (!wordBefore && wordAfter) {
                    c = ld;
                    if (opend) {
                        mark(opend);
                    }
                    opend = node;
                } else if (wordBefore && !wordAfter) {
                    c = rd;
                    if (!opend) {
                        mark(node);
                    }
                    opend = null;
                } else {
                    // " in the middle of a word?
                    mark(node);
                }
            } else if (c == '`') {
                if (!wordBefore && wordAfter) {
                    c = ls;
                    if (opens || !opend) {
                        mark(node);
                    }
                    opens = node;
                } else {
                    // ` on the run?
                    mark(node);
                }
            } else if (c == "'") {
                if (wordBefore && wordAfter) {
                    // an apostrophe
                    c = rs;
                } else if (!wordBefore && wordAfter) {
                    c = ls;
                    if (opens || !opend) {
                        mark(node);
                    }
                    opens = node;
                } else if (wordBefore && !wordAfter) {
                    c = rs;
                    if (before == 's') {
                        // probably plural possessive, don't close
                    } else {
                        if (!opens || !opend) {
                            mark(node);
                        }
                        opens = null;
                    }
                } else {
                    // ' floating free?
                    mark(node);
                }
            }

            node.data = c;
        });

        if (opens) {
            mark(opens);
        }
        if (opend) {
            mark(opend);
        }
    }

    forEach(all('h1, h2, h3, li, p, .figure'), quotify);

    // make it prettty
    var link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'stylesheet.css';
    doc.head.appendChild(link);

    // element whitelist check
    var whitelist = [
        'a',
        'blockquote',
        'br',
        'caption',
        'div',
        'h1',
        'h2',
        'h3',
        'hr',
        'i',
        'img',
        'li',
        'ol',
        'p',
        'script',
        'span',
        'sup',
        'table',
        'tbody',
        'td',
        'th',
        'thead',
        'tr',
        'ul'];
    forEach(doc.body.querySelectorAll('*'), function(elm) {
        assert(whitelist.indexOf(elm.tagName.toLowerCase()) != -1,
               elm.tagName + ' not in whitelist');
    });
}

function serialize(doc) {
    // remove the scripts
    forEach(doc.querySelectorAll('script'), remove);

    // sanitize whitespace
    doc.normalize();
    var walker = doc.createTreeWalker(doc, NodeFilter.SHOW_TEXT,
                                      null, false);
    while (walker.nextNode()) {
        var node = walker.currentNode;
        node.data = node.data.replace(/\s{2,}/g, '\n');
    }

    // add boilerplate
    doc.documentElement.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    var meta = doc.querySelector('meta');
    meta.content = 'application/xhtml+xml; charset=utf-8';

    // XML like it's 1999
    var html = new XMLSerializer().serializeToString(doc);
    html = html.replace(/.*<html/, '<html');
    return html;
}
