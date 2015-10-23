define([], function(){

    var isElementInViewport = function(el){

        if(typeof jQuery === "function" && el instanceof jQuery){
            el = el[0];
        }
        var rect = el.getBoundingClientRect();
        return (rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*
                                                                                                                                     * or
                                                                                                                                     * $(window).height()
                                                                                                                                     */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*
                                                                                     * or
                                                                                     * $(window).width()
                                                                                     */
        );
    };

    var triggerIfInView = function(trigger){
        if(isElementInViewport(trigger[0])){

            var pullTrigger = function($trigger, sendEvent){
                var eEvent  = $trigger.data('fire-on-open');
                var eParams = $trigger.data('fire-on-open-params');

                $trigger.attr('enabled', false);
                $('*[data-disable-when-fired="' + eEvent + '"]').attr('enabled', false);

                // extra params from the "before"
                var dynamicParamsStr = window.getComputedStyle($trigger[0], ':before').getPropertyValue('content');
                if(dynamicParamsStr && dynamicParamsStr.length > 0 && dynamicParamsStr != 'none'){

                    var dynamicParams = JSON.parse(dynamicParamsStr);
                    if(typeof dynamicParams == 'string'){
                        dynamicParams = JSON.parse(dynamicParams);
                    }
                    for(var item in dynamicParams) {
                        eParams[item] = dynamicParams[item];
                    }
                }
                $(window).trigger(eEvent, eParams);
            }

            if(trigger.hasClass('trigger-chain')){
                var target = $('#' + trigger.data('fire-on-open-params').trigger + '.scroll-trigger');
                if(target.length > 0){
                  trigger.attr('enabled', false);
                  pullTrigger(target, false);
                }
                else{
                    trigger.attr('enabled', false);
                    console.warn('scroll-trigger chaining must reference a valid target trigger in the fire-on-open-params');
                }
            }
            else{
                pullTrigger(trigger, true);
            }
        }
    };

    var fireAllVisible = function(){
        $('.scroll-trigger').each(function(){
            triggerIfInView($(this));
        });
    };

    $(window).on('scroll', function(){
        $('.scroll-trigger[enabled=true]').each(function(){
            triggerIfInView($(this));
        });
    });

    // don't wait for a scroll event if the trigger is already in view on page load

    $(window).on('fire-visible-scroll-triggers', function(){
        fireAllVisible();
    });

    return {
        fireAllVisible: function(){
            fireAllVisible();
        }
    };


});
