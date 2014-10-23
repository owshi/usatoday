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
