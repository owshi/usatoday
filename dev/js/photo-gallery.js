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

