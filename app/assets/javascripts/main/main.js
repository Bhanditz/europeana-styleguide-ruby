window.GoogleAnalyticsObject = '__ga__';
window.__ga__ = {
    q: [['create', 'UA-12776629-5', 'auto']],
    l: Date.now()
};

require.config({
  paths: {
    aurora:                        '../lib/audiocogs/aurora',
    blacklight:                    '../lib/blacklight/blacklight_all',
    channels:                      '../eu/channels',
    eu_carousel:                   '../eu/eu-carousel',
    featureDetect:                 '../global/feature-detect',
    flac:                          '../lib/audiocogs/flac',
    ga:                            '//www.google-analytics.com/analytics',
    global:                        '../eu/global',
    hotjar:                        '../lib/hotjar',

    leaflet:                       '../application-map',
    leaflet_iiif:                  '../lib/iiif/leaflet-iiif',

    imagesLoaded:                  '../lib/jquery.imagesloaded.min',
    jqDropdown:                    '../lib/jquery.dropdown',
    jquery:                        '../lib/jquery',
    jqScrollto:                    '../lib/jquery.scrollTo',
    media_controller:              '../eu/media/search-media-controller',
    media_viewer_iiif:             '../eu/media/search-iiif-viewer',
    media_viewer_pdf:              '../eu/media/search-pdf-ui-viewer',
    media_viewer_videojs:          '../eu/media/search-videojs-viewer',
    media_viewer_image:            '../eu/media/search-image-viewer',

    menus:                         '../global/menus',
    mootools:                      '../lib/iipmooviewer/js/mootools-core-1.5.1-full-nocompat-yc',
    pdfjs:                         '../lib/pdfjs/pdf',
    pdf_ui:                        '../lib/pdfjs/pdf-ui',
    pdf_lang:                      '../lib/pdfjs/l10n',
    photoswipe:                    '../lib/photoswipe/photoswipe',
    photoswipe_ui:                 '../lib/photoswipe/photoswipe-ui-default',
    resize:                        '../eu/util/resize',
    search_form:                   '../eu/search-form',
    search_home:                   '../eu/search-home',
    search_object:                 '../eu/search-object',
    videojs:                       '//vjs.zencdn.net/4.12/video',
    videojs_aurora:                '../lib/videojs-aurora/videojs-aurora',
    videojs_silverlight:           '../lib/videojs-silverlight/videojs-silverlight'
  },
  shim: {
    blacklight:     ['jquery'],
    featureDetect:  ['jquery'],
    jqDropdown:     ['jquery'],
    menus:          ['jquery'],
    placeholder:    ['jquery'],
    ga: {
      exports: "__ga__"
    }
  }
});

require(['jquery'], function( $ ) {
  $.holdReady( true );
  require(['blacklight'], function( blacklight ) {
    require(['channels', 'hotjar', 'global'], function( global, channels ) {
      $.holdReady(false);
      require(["ga"], function(ga) {
          ga("send", "pageview");
      });

    });
  });
});
