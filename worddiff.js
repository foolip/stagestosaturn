/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */

function forEach(list, func) {
    Array.prototype.forEach.call(list, func);
}

forEach(document.querySelectorAll('sup'), function(elm) {
    elm.parentNode.insertBefore(document.createTextNode(' '), elm);
});

alert(document.body.textContent.replace(/\s/g, ' '))
