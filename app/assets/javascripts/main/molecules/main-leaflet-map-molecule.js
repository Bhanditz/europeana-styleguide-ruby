require([require.toUrl('../config/main-config.js')], function() {
  require(['jquery'], function() {
    require(['leaflet', 'leaflet_zoom_slider'], function(){
      var L       = window.L;
      var w       = 500;
      var h       = 500;
      var osmUrl  = location.protocol + '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      var osmAttr = '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

      var init = function(){

        $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/leaflet-1.2.0/leaflet.css') + '" type="text/css"/>');
        $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/zoomslider/L.Control.Zoomslider.css') + '" type="text/css"/>');

        $('#' + window.el_map_id).css(
          {
            'height': h + 'px',
            'width':  w + 'px'
          }
        );

        var map = L.map(window.el_map_id).setView([51.505, -0.09], 13);

        map.addLayer(new L.TileLayer(osmUrl, {
          minZoom : 4,
          maxZoom : 18,
          attribution : osmAttr,
          type : 'osm'
        }));

      };

      $(document).ready(function(){
        init();
      });

    });
  });
});
