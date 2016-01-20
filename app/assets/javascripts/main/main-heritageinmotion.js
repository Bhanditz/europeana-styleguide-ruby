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
    aurora:                        '../lib/audiocogs/aurora',
    blacklight:                    '../lib/blacklight/blacklight_all',
    eu_carousel:                   '../eu/eu-carousel',
    eu_carousel_appender:          '../eu/eu-carousel-appender',
    eu_hierarchy:                  '../eu/eu-hierarchy',
    featureDetect:                 '../global/feature-detect',
    flac:                          '../lib/audiocogs/flac',
    ga:                            '//www.google-analytics.com/analytics',
    global:                        '../eu/global',
    heritage_in_motion:            '../eu/heritage_in_motion',
    hotjar:                        '../lib/hotjar',

    leaflet:                       '../application-map',
    leaflet_iiif:                  '../lib/iiif/leaflet-iiif',

    jqDropdown:                    '../lib/jquery.dropdown',
    jquery:                        '../lib/jquery',
    jqScrollto:                    '../lib/jquery.scrollTo',
    jsTree:                        '../lib/jstree/jstree',
    media_controller:              '../eu/media/search-media-controller',
    media_viewer_iiif:             '../eu/media/search-iiif-viewer',
    media_viewer_pdf:              '../eu/media/search-pdf-ui-viewer',
    media_viewer_image:            '../eu/media/search-image-viewer',
    media_viewer_videojs:          '../eu/media/search-videojs-viewer',
    menus:                         '../global/menus',
    mootools:                      '../lib/iipmooviewer/js/mootools-core-1.5.1-full-nocompat-yc',

    NOFlogger:                     '../lib/904Labs/904-logger',
    NOFremote:                     '../lib/904Labs/noflogging-0.2.min',
//    NOFremote:                     'http://analytics.904labs.com/static/jssdk/noflogging-0.2.min',

    pdfjs:                         '../lib/pdfjs/pdf',
    pdf_ui:                        '../lib/pdfjs/pdf-ui',
    pdf_lang:                      '../lib/pdfjs/l10n',
    purl:                          '../lib/purl/purl',
    photoswipe:                    '../lib/photoswipe/photoswipe',
    photoswipe_ui:                 '../lib/photoswipe/photoswipe-ui-default',

    util_foldable:                 '../eu/util/foldable-list',
    util_resize:                   '../eu/util/resize',
    util_scrollEvents:             '../eu/util/scrollEvents',

    settings:                      '../eu/settings',

    search_form:                   '../eu/search-form',
    search_home:                   '../eu/search-home',
    search_object:                 '../eu/search-object',
    search_results:                '../eu/search-results',

    smartmenus:                    '../lib/smartmenus/jquery.smartmenus',
    smartmenus_keyboard:           '../lib/smartmenus/keyboard/jquery.smartmenus.keyboard',

    touch_move:                     '../lib/jquery.event.move',
    touch_swipe:                    '../lib/jquery.event.swipe',

    videojs:                       '//vjs.zencdn.net/4.12/video',
//    videojs:                       '//vjs.zencdn.net/5.0/video',
    videojs_aurora:                '../lib/videojs-aurora/videojs-aurora',
    videojs_silverlight:           '../lib/videojs-silverlight/videojs-silverlight'
  },
  shim: {
    blacklight:     ['jquery'],
    featureDetect:  ['jquery'],
    jqDropdown:     ['jquery'],
    menus:          ['jquery'],
    placeholder:    ['jquery'],
    smartmenus:     ['jquery'],
    ga: {
      exports: "__ga__"
    }
  }
});


require(['jquery', 'heritage_in_motion', 'global'], function() {

    require(["ga"], function(ga) {
        ga("send", "pageview");
    });
});
