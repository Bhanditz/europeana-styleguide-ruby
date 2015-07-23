require.config({
  baseUrl: '/js/dist',
  paths: {
    jquery:                     'lib/jquery',
    mootools:                   'lib/iipmooviewer/js/mootools-core-1.5.1-full-nocompat-yc',
    iipmooviewer:               'lib/iipmooviewer/js/iipmooviewer-2.0-min',
    media_viewer_iipmooviewer:  'eu/media/search-iipmooviewer-viewer'
  },
  shim: {
    media_viewer_videojs: ['jquery']
  }
});

require(['jquery'], function($){
  require(['media_viewer_iipmooviewer'], function( viewer ) {
    if ( viewer ) {
      viewer.init();
    }
  });
});
