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
                $img = el.find(".slide img"),
                $thumb = el.find(".thumbnail"),
                $controls = el.find(".control-btn"),
                lastThumb = $thumb.length - 1;

            var changeSlide = function(i) {
                $thumb.removeClass("active");
                $thumb.eq(i).addClass("active");
                var attr = $thumb.eq(i).find("img").attr("src");
                $img.attr("src", attr);
                checkViewport(i);
            }


            var goPrev = function() {
                var activeSlide = el.find(".thumbs .active").index();
                if (activeSlide == 0) {
                    activeSlide = lastThumb
                } else {
                    activeSlide--;
                }
                changeSlide(activeSlide);
            }

            var goNext = function() {
                var activeSlide = el.find(".thumbs .active").index();
                if (activeSlide == lastThumb) {
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
            $controls.on("dbclick",function(){
                return
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

            

            //Scrollbar

            var $area = el.find(".scroll-area"),
                $bar = el.find(".scrollbar"),
                $drag = el.find(".scrolldrag"),
                viewportWidth = el.find(".thumbs").width(),
                areaWidth, dragWidth;

            var setAreaWidth = function() {
                var thumbWidth = $thumb.width() + parseInt($thumb.css("border-width")) * 2;
                areaWidth = $thumb.length * thumbWidth + ($thumb.length - 1) * parseInt($thumb.eq(1).css("margin-left"));
                $area.css({
                    "width": areaWidth + "px"
                });

            }

            var setDragWidth = function() {
                var q = viewportWidth / areaWidth;
                dragWidth = el.find(".scrollbar").width() * q;
                if (dragWidth > el.find(".scrollbar").width()) {
                    dragWidth = el.find(".scrollbar").width()
                }
                dragWidth = Math.round(dragWidth);
                $drag.css({
                    "width": dragWidth + "px"
                });

            }

            var initScroll = function() {
                setAreaWidth();
                setDragWidth();
            }

            initScroll();

            $drag.draggable({
                axis: "x",
                containment: "parent",
                addClasses: false,
                cursor: 'pointer',
                stop: function() {
                    dragGoing = false;
                    changeDrag();
                }
            });

            var dragEndPos = $bar.width() - dragWidth,
                areaEndPos = -(areaWidth - viewportWidth),
                movCoef = areaEndPos / dragEndPos,
                dragHover = false,
                dragGoing = false;

            var changeDrag = function() {
                if (dragHover || dragGoing) {
                    $drag.addClass('hover')
                } else {
                    $drag.removeClass('hover')
                }
            }

            $drag.on("drag", function() {
                var dragLeftPos = parseInt($drag.css('left')),
                    areaPos = Math.round(dragLeftPos * movCoef);
                $area.css({
                    'left': areaPos + 'px'
                });
                dragGoing = true;
                changeDrag();
            });

            $drag.on('mouseenter', function() {
                dragHover = true;
                changeDrag();
            });

            $drag.on('mouseleave', function() {
                dragHover = false;
                changeDrag();
            });

            var checkViewport = function(i) {
                var areaPos = parseInt($area.css("left")),
                    thumbWidth = $thumb.width() + parseInt($thumb.css("border-width")) * 2 + parseInt($thumb.eq(1).css("margin-left")),
                    slidesInViewport = Math.round((viewportWidth + 30) / thumbWidth),
                    firstVisible = Math.round(-areaPos / thumbWidth) + 1,
                    lastVisible = firstVisible + slidesInViewport - 1,
                    toLastThumb = -(areaWidth - viewportWidth);
                    if (areaPos % thumbWidth != 0) {
                      areaPos = thumbWidth * parseInt(areaPos / thumbWidth); 
                    }
                i++;
              
                if (i >= firstVisible && i <= lastVisible) {

                } else {
                    if (i == lastThumb + 1) {
                        $area.stop().animate({
                            "left": toLastThumb + "px"
                        }, 200);
                        areaPos = toLastThumb;
                    } else if (i === 1) {
                        $area.stop().animate({
                            "left": "0px"
                        }, 200);
                        areaPos = 0;
                    } else {
                        if (Math.abs(i - firstVisible) < Math.abs(i - lastVisible)) {
                            $area.stop().animate({
                                "left": areaPos + thumbWidth + "px"                                
                            }, 200);
                            areaPos = areaPos + thumbWidth;
                        } else {
                            $area.stop().animate({
                                "left": areaPos - thumbWidth + "px"                                
                            }, 200);
                            areaPos = areaPos - thumbWidth;
                        }
                    }

                }
                
               areaDrag(areaPos);
            }

            var areaDrag = function(p){
                var areaPos = p,
                 dragLeftPos = Math.round( areaPos / movCoef);
                 $drag.stop().animate({left:dragLeftPos+"px"}, 100);
            }
        }
    })(jQuery);
