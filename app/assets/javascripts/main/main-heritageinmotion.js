window.GoogleAnalyticsObject = '__ga__';
window.__ga__ = {
    q: [['create', '**** ANALYTICS CODE HERE ****', 'auto']],
    l: Date.now()
};

/*
var release   = null;

var scripts = document.getElementsByTagName('script');
for (var i=0; i<scripts.length; i++){
    var v = scripts[i].getAttribute('js-version');
    if(v){
        release = v;
    }
};
*/

require.config({
  //urlArgs: "cache=" + (release || Math.random()),
  paths: {
    embedly:                       '//cdn.embedly.com/widgets/platform',
    featureDetect:                 '../global/feature-detect',
    ga:                            '//www.google-analytics.com/analytics',
    global:                        '../eu/global',
    heritage_in_motion:            '../eu/heritage_in_motion',
    jqDropdown:                    '../lib/jquery/jquery.dropdown',
    jquery:                        '../lib/jquery',
    jqScrollto:                    '../lib/jquery.scrollTo',
    lightbox:                      '../lib/featherlight/src/featherlight',
    menus:                         '../global/menus',
    mootools:                      '../lib/iipmooviewer/js/mootools-core-1.5.1-full-nocompat-yc',
    util_foldable:                 '../eu/util/foldable-list',
    util_resize:                   '../eu/util/resize',
    util_scrollEvents:             '../eu/util/scrollEvents',
    settings:                      '../eu/settings',
    smartmenus:                    '../lib/smartmenus/jquery.smartmenus',
    smartmenus_keyboard:           '../lib/smartmenus/keyboard/jquery.smartmenus.keyboard',
    sticky:                        '../lib/sticky/jquery.sticky',
    tagsinput:                     '../lib/tagsinput/jquery.tagsinput.min',
    touch_move:                    '../lib/jquery/jquery.event.move',
    touch_swipe:                   '../lib/jquery/jquery.event.swipe',
    xeditable:                     '../lib/x-editable/jquery-editable-poshytip',
  },
  shim: {
    blacklight:     ['jquery'],
    featureDetect:  ['jquery'],
    jqDropdown:     ['jquery'],
    menus:          ['jquery'],
    placeholder:    ['jquery'],
    smartmenus:     ['jquery'],
    sticky:         ['jquery'],
    xeditable:      ['jquery'],
    ga: {
      exports: "__ga__"
    }
  }
});


require(['jquery'], function( $ ) {

    require(['global', 'smartmenus', 'heritage_in_motion'], function() {

        require(["ga"], function(ga) {
            ga("send", "pageview");
        });
    });

});

