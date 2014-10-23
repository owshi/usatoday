/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.12',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
            // Clean up the data we added to the element
            $.removeData(this, 'mousewheel-line-height');
            $.removeData(this, 'mousewheel-page-height');
        },

        getLineHeight: function(elem) {
            var $elem = $(elem),
                $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
            if (!$parent.length) {
                $parent = $('body');
            }
            return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
            normalizeOffset: true  // calls getBoundingClientRect for each event
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0,
            offsetX    = 0,
            offsetY    = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Normalise offsetX and offsetY properties
        if ( special.settings.normalizeOffset && this.getBoundingClientRect ) {
            var boundingRect = this.getBoundingClientRect();
            offsetX = event.clientX - boundingRect.left;
            offsetY = event.clientY - boundingRect.top;
        }

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));

;
(

    function($) {

        $.fn.photoGallery = function() {

            if (this.length == 0) return this;
            if (this.length > 1) {
                this.each(function() {
                    $(this).photoGallery(options)
                });
                return this;
            }
            var el = this,
                $slide = el.find(".slide"),
                $thumb = el.find(".thumbnail"),
                $controls = el.find(".control-btn"),
                lastSlide = $slide.length - 1;

            var changeSlide = function(i) {
                $thumb.removeClass("active");
                $thumb.eq(i).addClass("active");
                $slide.removeClass("active");
                $slide.eq(i).addClass("active");
            }

            var goPrev = function() {
                var activeSlide = el.find(".active").index();
                if (activeSlide == 0) {
                    activeSlide = lastSlide
                } else {
                    activeSlide--;
                }
                changeSlide(activeSlide);
            }

            var goNext = function() {
                var activeSlide = el.find(".active").index();
                if (activeSlide == lastSlide) {
                    activeSlide = 0;
                } else {
                    activeSlide++;
                }
                changeSlide(activeSlide);
            }
            el.find("a").on("click", function(e) {
                e.preventDefault();
            });

            $thumb.on("click", function() {
                var i = $(this).index();
                changeSlide(i);
            });

            $controls.on("click", function() {
                if ($(this).hasClass('gallery-prev')) {
                    goPrev();
                } else if ($(this).hasClass('gallery-next')) {
                    goNext();
                } else if ($(this).hasClass('fullscreen-btn')) {
                    goFullScreen();
                }
            });
        }
    })(jQuery);


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

;
(function($) {

    var defaults = {
        interval: 4000,
    };

    $.fn.sliderGallery = function(options) {
        if (this.length == 0) return this;
        if (this.length > 1) {
            this.each(function() {
                $(this).sliderGallery(options)
            });
            return this;
        }

        // Variables

        var obj = {},
            el = this
        $activeLi,
        sliderInterval;

        obj.viewportWidth = el.width();
        obj.viewportHeight = el.height();
        obj.sliderBody = el.find(".slider-body");
        obj.slideNum = el.find(".slide").length;
        obj.sliderPos = parseInt(obj.sliderBody.css("left"));

        var initSlider = function() {
            var bodyWidth = obj.viewportWidth * obj.slideNum;
            obj.sliderBody.css({
                "width": bodyWidth + "px"
            });
        }

        var initPagination = function() {
            el.append("<ul class='pagination'></ul>");
            for (var i = 0; i < obj.slideNum; i++) {
                el.find(".pagination").append("<li></li>");
            }
            el.find(".pagination li").eq(0).addClass("active");
        }

        var nextSlide = function() {
            if ($activeLi < obj.li.length - 1) {
                obj.sliderBody.animate({
                    left: "-=" + obj.viewportWidth + "px"
                });
                obj.li.removeClass("active");
                $activeLi++;
                obj.li.eq($activeLi).addClass("active");
            } else {
                obj.sliderBody.animate({
                    left: obj.sliderPos + "px"
                });
                obj.li.removeClass("active");
                $activeLi = 0;
                obj.li.eq($activeLi).addClass("active");
            }
        }

        obj.startInterval = function() {
            this.intervalize = setInterval(function() {
                nextSlide()
            }, obj.settings.interval);
        }

        obj.stopInterval = function() {
            clearInterval(this.intervalize);
        }




        // Initializing slider

        var init = function() {
            obj.settings = $.extend({}, defaults, options);
            initSlider();
            initPagination();
            obj.startInterval();
        }





        init();

        obj.li = el.find(".pagination li");
        obj.activeLi = el.find(".pagination li.active");

        var $activeLi = obj.activeLi.index();

        el.mouseenter(function() {
            obj.stopInterval();
        });
        el.mouseleave(function() {
            obj.startInterval();
        });
        obj.li.on("click", function() {
            var i = $(this).index(),
                left = -1 * (obj.viewportWidth * i - obj.sliderPos);
            obj.sliderBody.animate({
                left: left + "px"
            });
            obj.li.removeClass("active");
            $(this).addClass("active");
            $activeLi = $(this).index();
        });

    }

})(jQuery);
$("#featured-slider").sliderGallery();
$("#popular-slider").sliderGallery();
