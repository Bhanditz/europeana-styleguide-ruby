define(['jquery', 'jqScrollto', 'resize'], function($){

    /**
     * @cmp: the container
     * 
     */
    return function(cmp, data){

        log = function(msg){
            //console.log(msg);
        }

        var position = 1; // index of currently viewed item
        var btnLeft , btnRight , items;
        var cmp = $(cmp);
        var minSpacingPx = 15;
        var spacing = minSpacingPx;
        var inView = 0;
        var totalLoaded = data.length;
        var animating = false;
        var scrollTime = 1000;

        var classData = {
            "arrowClasses" : {
                "container" : "js-mlt-arrows",
                "left" : "left",
                "right" : "right"
            },
            "itemClass" : "mlt-item",
            "itemDivClass" : "mlt-img-div height-to-width",
            "itemInnerClass" : "inner",
            "itemLinkClass" : "link",
            "titleClass" : "mlt-title"
        };

        var resize = function(){

            log('resizing');

            var w = cmp.width();
            var itemW = items.find('.' + classData.itemClass + '').first().outerWidth();
            var maxFit = parseInt(w / (itemW + minSpacingPx));
            spacing = minSpacingPx;

            if(maxFit == 1){
                spacing = (w - itemW) / 2;
                spacing += 2;
            }
            else{
                spacing = (w - (maxFit * itemW)) / (maxFit - 1);
            }
            spacing = parseInt(spacing);

            log('w = ' + w + 'spacing will be ' + spacing + ', maxFit = ' + maxFit);

            inView = maxFit;

            items.find('.' + classData.itemClass + '').css('margin-left', parseInt(spacing) + 'px');

            log('w: ' + w + ', itemW: ' + itemW + ', maxFit ' + maxFit);
            
            if(maxFit != 1){
                items.find('.' + classData.itemClass + ':first').css('margin-left', '0px');
            }
            
            items.css('width', w + (totalLoaded * (itemW + spacing)));

            var anchor = function(){
                animating = true;
                cmp.css('overflow-x', 'hidden');
                items.css('left', '0');

                cmp.scrollTo(items.find('.' + classData.itemClass + ':nth-child(' + position + ')'), inView == 1 ? 0 : scrollTime, {
                    "axis" : "x",
                    "onAfter" : function(){
                        
                        var done = function(){
                            cmp.css('overflow-x', 'hidden');
                            animating = false;
                            setArrowState();
                        };

                        if(inView == 1){
                            var margin = items.find('.' + classData.itemClass + ':first').css('margin-left');
                            items.css('left', spacing + 'px');
                        }
                        else{
                            items.css('left', '0');
                        }
                        done();
                    }
                });
            }
            anchor();
        };

        var setArrowState = function(){

            if(position == 1){
                btnLeft.hide();
            }
            else{
                btnLeft.show();
            }
            if(position + inView <= totalLoaded){
                btnRight.show();
            }
            else{
                log('hide right arrow: position ' + position + ' + inView ' + inView + ' <= ' + totalLoaded);

                btnRight.hide();
            }
        }

        var goLeft = function(){

            animating = true;
            var prevItem = position - inView < 1 ? 1 : position - inView;
            log('prev index = ' + prevItem);

            position = prevItem;

            prevItem = items.find('.' + classData.itemClass + ':nth-child(' + prevItem + ')');

            cmp.css('overflow-x', 'hidden');
            items.css('left', '0');

            cmp.scrollTo(prevItem, inView == 1 ? 0 : 1000, {
                "axis" : "x",
                "onAfter" : function(){

                    var done = function(){

                        cmp.css('overflow-x', 'hidden');
                        animating = false;
                        setArrowState();
                    };

                    if(inView == 1){
                        var margin = items.find('.' + classData.itemClass + ':first').css('margin-left');
                        items.css('left', spacing + 'px');
                    }
                    else{
                        items.css('left', '0');
                    }

                    done();

                }
            });

        };

        var goRight = function(){

            if((position + inView) > totalLoaded){
                return;
            }

            var nextIndex = position + inView;
            var nextItem = items.find('.' + classData.itemClass + ':nth-child(' + nextIndex + ')');

            position = nextIndex;

            cmp.css('overflow-x', 'hidden');

            items.css('left', '0');

            animating = true;
            cmp.scrollTo(nextItem, inView == 1 ? 0 : 1000, {
                "axis" : "x",
                "onAfter" : function(){

                    var done = function(){

                        cmp.css('overflow-x', 'hidden');
                        animating = false;
                        setArrowState();
                    };

                    if(inView == 1){
                        var margin = items.find('.' + classData.itemClass + ':first').css('margin-left');
                        items.css('left', spacing + 'px');
                    }
                    else{
                        items.css('left', '0');
                    }

                    done();

                }
            });

        };

        var getItemMarkup = function(data){

            return '' + '<li class="' + classData.itemClass + '">' + '<div class="' + classData.itemDivClass + '" style="background-image: url(' + data.thumb + ')">' + '<div class="' + classData.itemInnerClass + '"><a class="' + classData.itemLinkClass + '" href="' + data.link
                    + '">&nbsp;</a></div>' + '</div>' + '<span class="' + classData.titleClass + '">' + '<a href="' + data.link + '">' + data.title + '</a>';
            +'</span>' + '</li>';
        }

        var init = function(){

            items = cmp.find('ul');
            btnLeft = $('<a class="' + classData.arrowClasses.left + '">&#10096;</a>');
            btnRight = $('<a class="' + classData.arrowClasses.right + '">&#10097;</a>');

            cmp.before('<div class="' + classData.arrowClasses.container + '"></div>');
            cmp.prev('.' + classData.arrowClasses.container).append(btnLeft);
            cmp.prev('.' + classData.arrowClasses.container).append(btnRight);

            totalLoaded = items.find('.' + classData.itemClass).length;

            $.each(data, function(i, ob){

                items.append(getItemMarkup(ob));
                totalLoaded += 1;
            });

            if(typeof Ellipsis != 'undefined'){
                $('.' + classData.itemClass + ' .info').each(function(i, ob){

                    new Ellipsis(ob);
                });
            }

            btnLeft.click(function(e){

                if(!animating){
                    log('go left....');
                    goLeft();
                }
                e.stopPropagation();
                return false;
            });

            btnRight.click(function(e){

                if(!animating){
                    log('go right....');
                    goRight();
                }
                e.stopPropagation();
                return false;
            });

            if(!$("html").hasClass("ie8")){

                var leftRight = function(direction){

                    if(animating){
                        alert('return because animating');
                        return;
                    }
                    else{
                        alert(direction)
                    }
                };

                if(typeof cmp.touchwipe != 'undefined'){
                    cmp.touchwipe({

                        wipeLeft : function(){

                            btnRight.click();
                        },
                        wipeRight : function(){

                            btnLeft.click();
                        },
                        wipeUp : function(){

                        },
                        wipeDown : function(){

                        },
                        min_move_x : 20,
                        min_move_y : 20,
                        preventDefaultEvents : true
                    });
                }
            }

            if(typeof $(window).europeanaResize != 'undefined'){
                $(window).europeanaResize(function(){
                    resize();
                });
            }
            resize();
        };

        init();
        return {
            resize : function(){

                resize();
            },
            inView : function(){

                return fnInView();
            },
            goLeft : function(){

                goLeft();
            },
            goRight : function(){

                goRight();
            }
        }
    };
});
