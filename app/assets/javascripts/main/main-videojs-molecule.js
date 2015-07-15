require.config({
  baseUrl: '/js/dist',
  paths: {
    jquery:                'lib/jquery',
    aurora:                'lib/audiocogs/aurora',
    flac:                  'lib/audiocogs/flac',
    videojs:               '//vjs.zencdn.net/4.12/video',
    videojs_aurora:        'lib/videojs-aurora/videojs-aurora',
    videojs_silverlight:   'lib/videojs-silverlight/videojs-silverlight',
    media_viewer_videojs:  'eu/media/search-videojs-viewer'
  },
  shim: {
    media_viewer_videojs: ['jquery']
  }
});

require(['jquery'], function($){
  require(['media_viewer_videojs'], function(viewer){
    viewer.init();
  });
});
