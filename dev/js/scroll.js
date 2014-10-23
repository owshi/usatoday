;
document.onmousemove = mouseMove;

function mouseMove(ev) {
    ev = ev || window.event;
    var mousePos = mouseCoords(ev);
    console.log(mousePos.x, mousePos.y)
}

function mouseCoords(ev) {
    if (ev.pageX || ev.pageY) {
        return {
            x: ev.pageX,
            y: ev.pageY
        };
    }
    return {
        x: ev.clientX + document.body.scrollLeft - document.body.clientLeft,
        y: ev.clientY + document.body.scrollTop - document.body.clientTop
    };
};
(function($) {
    $.fn.scrollBar = function() {
        if (this.length == 0) return this;
        if (this.length > 1) {
            this.each(function() {
                $(this).scrollBar(options)
            });
            return this;
        }

        
    }
});
