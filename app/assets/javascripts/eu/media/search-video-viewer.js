define([], function() {
  'use strict';

  var
  mediaviewer,
  viewer;

  function initialiseViewer() {
    videojs(
      viewer,
      {}
    );
  }

  function setTechOrder() {
    var
    tech_order = viewer.getAttribute('data-tech-order');

    if ( !tech_order || typeof videojs === 'undefined' ) {
      return;
    }

    videojs.options.techOrder = [tech_order];
  }

  function determineMediaViewer() {
    viewer = document.getElementById('videojs-viewer');

    if ( !viewer || typeof viewer === 'undefined' ) {
      return;
    }

    switch ( viewer.getElementsByTagName('source')[0].getAttribute('type') ) {
      case 'video/wmv':
      case 'video/x-msvideo':
      case 'video/x-ms-wmv':
        require(['videojs'], function() {
          require(['videojs_silverlight'], function() {
            videojs.options.silverlight.xap = "/js/dist/lib/videojs-silverlight/video-js.xap";
            setTechOrder();
            initialiseViewer();
          });
        });
        break;

      default:
        require(['videojs'], function() { initialiseViewer(); });
    }
  }

  function init() {
    determineMediaViewer();
    console.log('init search video viewer');
  }

  return {
    init:function() {
      init();
    }
  };
});