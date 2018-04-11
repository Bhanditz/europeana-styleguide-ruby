define(['jquery', 'util_resize'], function($){
  'use strict';

  /*
    Example 1

    http://localhost:3000/portal/en/record/07931/diglit_zygulski2009.html?q=edm_datasetName%3A07931*&debug=json

    webResource / svcsHasService = http://diglit.ub.uni-heidelberg.de/image/zygulski2009/000a.jpg

    manifestUrl:
      svcsHasService  +  /info.json
    =
      http://diglit.ub.uni-heidelberg.de/image/zygulski2009/000a.jpg/info.json

    > http://styleguide.europeana.eu/patterns/molecules-components-iiif/molecules-components-iiif.html?manifestUrl=http://diglit.ub.uni-heidelberg.de/image/zygulski2009/000a.jpg/info.json


    Example 2

    http://iiif.europeana.eu/AZ_1927_01_04_0001

    manifestUrl:
      svcsHasService  +  /info.json
    =
      http://iiif.europeana.eu/AZ_1927_01_04_0001/info.json

    > http://styleguide.europeana.eu/patterns/molecules-components-iiif/molecules-components-iiif.html?manifestUrl=http://iiif.europeana.eu/AZ_1927_01_04_0001/info.json
  */


  var iiif;
  var config;
  var currentImg        = 0;
  var Leaflet           = null;
  var maxZoom           = 5;
  var totalImages;

  var labelledData      = {}; // JSON (entire manifest): data.label: data
  var iiifLayers        = {}; // Map layers (loaded): label: layer
  var miniMapCtrls      = {}; // Mini map object storage
  var allCanvases       = [];
  var iiifConf          = { maxZoom: maxZoom, setMaxBounds: true, edgeBufferTiles: 1 };

  var features          = {};
  var transcriptionIsOn = false;

  function log(msg) {
    console.log(msg);
  }

  /**
   * @centreIndex
   *
   * Called on init and after navigation operations
   * */
  var load = function(centreIndexIn, singleImageInfo){

    var iiifConfInstance = $.extend({}, iiifConf, {fitBounds: config.miniMap ? false : true, setMaxBounds: false});
    iiifConf = iiifConfInstance;
    window.iiifFitBounds = iiifConf.fitBounds;

    $.extend(iiifConf, {fitBounds: config.miniMap ? false : true, setMaxBounds: false});

    if(config.miniMap){
      $(document).on('click', '.mini-map-ctrls .icon', function(e){

        var tgt = $(e.target).parent();
        var newZoom;

        if(tgt.hasClass('fit-bounds')){
          iiifLayers[currentImg]._fitBounds();
        }
        else if(tgt.hasClass('zoom-out')){

          newZoom = iiif.getZoom() - 1;

          if(newZoom >= 0){

            iiif.setZoom(newZoom);

            if(newZoom == 0){
              tgt.addClass('disabled');
            }
            if(newZoom == 0){
              tgt.removeClass('disabled');
            }
          }
        }
        else if(tgt.hasClass('zoom-in')){

          newZoom = iiif.getZoom() + 1;

          if(newZoom <= maxZoom){

            iiif.setZoom(newZoom);

            if(newZoom == maxZoom){
              tgt.addClass('disabled');
            }
            else{
              tgt.removeClass('disabled');
            }
          }
        }
      });
    }


    if(singleImageInfo){

      var layer = Leaflet.tileLayer.iiif(singleImageInfo, iiifConf);

      iiifLayers['single'] = layer;
      layer.addTo(iiif);

      if(config.miniMap){
        miniMapCtrls['single'] = new Leaflet.Control.MiniMap(Leaflet.tileLayer.iiif(singleImageInfo), config.miniMap);
      }

    }
    else{

      var noToLoad    = 5;
      var noLoaded    = 0;
      var centreIndex = centreIndexIn ? centreIndexIn : currentImg;
      var index       = Math.max(centreIndex - parseInt(noToLoad/2), 0);
      var done        = false;

      while(!done){

        if(noLoaded == noToLoad){
          done = true;
        }
        else if(index >= allCanvases.length){
          done = true;
        }
        else{
          var data      = allCanvases[index];
          var layerName = index + '';
          var jsonUrl   = data.images[0].resource.service['@id'] + '/info.json';

          if(!iiifLayers[layerName]){
            var iiifLayer         = Leaflet.tileLayer.iiif(jsonUrl, iiifConf);
            iiifLayers[layerName] = iiifLayer;
            noLoaded              = noLoaded + 1;

            if(config.miniMap){
              miniMapCtrls[layerName] = new Leaflet.Control.MiniMap(Leaflet.tileLayer.iiif(jsonUrl), config.miniMap);
            }
          }
          index += 1;
        }
      }
    }

  };

  var switchLayer = function(destLayer) {
    for(var base in iiifLayers) {
      if(iiif.hasLayer(iiifLayers[base]) && iiifLayers[base] != destLayer) {
        iiif.removeLayer(iiifLayers[base]);
      }
      if(miniMapCtrls[base]){
        iiif.removeControl(miniMapCtrls[base]);
      }
    }
    iiif.addLayer(destLayer);
  };

  var updateCtrls = function(){

    $('#iiif-ctrl .title').html(Object.keys(labelledData)[currentImg + '']);
    $('#iiif-ctrl .jump-to-img').val(currentImg + 1);
    $('#iiif-ctrl .first').attr('disabled', currentImg == 0);
    $('#iiif-ctrl .prev').attr('disabled', currentImg == 0);
    $('#iiif-ctrl .next').attr('disabled', currentImg == totalImages-1);
    $('#iiif-ctrl .last').attr('disabled', currentImg == totalImages-1);
    $('#iiif-ctrl .jump-to-img').attr('disabled', totalImages == 1);

  };

  var updateTranscriptCtrls = function(){

    var $transcriptions = $('.transcriptions');

    $transcriptions.find('.transcription').addClass('hidden');

    if($transcriptions.find(' > .' + currentImg).length == 0){
      require(['mustache'], function(Mustache){
        Mustache.tags = ['[[', ']]'];

        var template = $('#template-iiif-transcription').text();

        $.getJSON(config.transcriptions.urls[currentImg]).done(function(data){
          data['index'] = currentImg + '';
          $transcriptions.append(Mustache.render(template, data));
        });
      });
    }
    else{
      $transcriptions.find('.transcription.' + currentImg).removeClass('hidden');
    }
  };

  var nav = function($el, layerName){

    if($el.attr('disabled')){
      return;
    }

    var layer = iiifLayers[layerName + ''];

    if(!layer){
      $('#iiif').addClass('loading');
      load(layerName);
      layer = iiifLayers[layerName + ''];
      $('#iiif').removeClass('loading');
    }
    switchLayer(layer);
    currentImg = layerName;
    updateCtrls();
    addTranscriptions(layerName + '');
    addMiniMap(layerName + '');
  };

  var initUI = function(){

    $('#iiif').addClass('loading');

    iiif = Leaflet.map('iiif', {
      center: [0, 0],
      crs: Leaflet.CRS.Simple,
      zoom: config.zoom ? config.zoom : 0,
      maxZoom: maxZoom,
      zoomsliderControl: config.zoomSlider,
      zoomSnap: 0.5
    });

    $(window).on('refresh-leaflet-map', function(){
      iiif.invalidateSize();
    });

    $(window).europeanaResize(function(){
      setTimeout(function(){
        iiif.invalidateSize();
        console.log('timeout done 301');
      }, 301);
    });

    if(config.fullScreenAvailable){
      window.L.control.fullscreen({
        maxZoom: maxZoom,
        zoomsliderControl: config.zoomSlider,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: 'topright',
          forceSeparateButton: true
        }
      });
    }

    iiif.on('enterFullscreen', function(){
      $('.leaflet-container').css('background-color', '#000');
    });

    iiif.on('exitFullscreen', function(){
      $('.leaflet-container').removeAttr('style');
    });

    $('#iiif-ctrl .first').off('click').on('click', function(e){
      e.preventDefault();
      nav($(this), 0);
    });

    $('#iiif-ctrl .prev').off('click').on('click', function(e){
      e.preventDefault();
      nav($(this), currentImg-1);
    });

    $('#iiif-ctrl .next').off('click').on('click', function(e){
      e.preventDefault();
      nav($(this), currentImg+1);
    });

    $('#iiif-ctrl .last').off('click').on('click', function(e){
      e.preventDefault();
      nav($(this), totalImages-1);
    });

    $(iiif._container).off('keydown').on('keydown', function(e) {
      var key = window.event ? e.keyCode : e.which;
      e = e || window.event;
      if(e.shiftKey || e.ctrlKey){
        if(key == 37){
          $('#iiif-ctrl .prev').click();
        }
        if(key == 38){
          $('#iiif-ctrl .first').click();
        }
        if(key == 39){
          $('#iiif-ctrl .next').click();
        }
        if(key == 40){
          $('#iiif-ctrl .last').click();
        }
        if([37, 38, 39, 40].indexOf(key) > -1){
          e.stopPropagation();
          e.preventDefault();
        }
      }
    });

    $('#iiif-ctrl .jump-to-img').off('keydown').on('keydown', function(e) {
      var key = window.event ? e.keyCode : e.which;
      if(key == 13){
        var val = parseInt($(this).val());
        if(!isNaN(val) && val > 0 && val < totalImages+1){
          nav($(this), val-1);
        }
        else{
          $(this).val(currentImg+1);
        }
      }
    });
  };

  var setTotalImages = function(total){
    totalImages = total;
    $('#iiif-ctrl .total-images').html('/ ' + totalImages);
  };

  function initViewer(manifestUrl) {

    initUI();

    var isSingle = (manifestUrl.indexOf('info.json') == manifestUrl.length - ('info.json').length)
    || (manifestUrl.indexOf('iiifv2.json') == manifestUrl.length - ('iiifv2.json').length);

    if(isSingle){
      setTotalImages(1);
      load(1, manifestUrl);
      $('#iiif').removeClass('loading');
      $('.media-viewer').trigger('object-media-open', {hide_thumb: true});

      updateCtrls();
      addTranscriptions(currentImg + '', true);
      addMiniMap(currentImg + '');
    }
    else{

      // Grab a IIIF manifest
      $.getJSON(manifestUrl).done(function(data){

        $.each(data.sequences[0].canvases, function(_, val) {
          labelledData[val.label] = val;
          allCanvases.push(val);
        });

        setTotalImages(allCanvases.length);
        load();

        $('#iiif').removeClass('loading');

        iiifLayers['0'].addTo(iiif);

        $('.media-viewer').trigger('object-media-open', {hide_thumb:true});

        updateCtrls();
        addTranscriptions(currentImg + '', true);
        addMiniMap(currentImg + '');

      }).fail(function(jqxhr) {
        log('error loading manifest (' + manifestUrl +  '): ' + JSON.stringify(jqxhr, null, 4));
        $('.media-viewer').trigger({'type': 'remove-playability', '$thumb': config.thumbnail, 'player': 'iiif'});
      });
    }

  }

  function highlightTranscript($t){

    if($t.length > 0){
      $('.transcription:not(.hidden) .highlight').removeClass('highlight');
      $t.addClass('highlight');
      if($t[0].nodeName.toUpperCase() == 'WORD'){
        $t.closest('p').addClass('highlight');
      }
      $('.transcriptions').scrollTo($t, 333, {'offset': -16});
    }
  }

  function resetFeatures(){
    iiifLayers[currentImg + '-f'].eachLayer(function(layer){
      iiifLayers[currentImg + '-f'].resetStyle(layer);
    });
  }

  function highlightFeature(f){

    if(!f){
      return;
    }

    // nested features unavailable to capture this. decided to use transcript to access parent instead of embedding references within model and markup
    var transcriptionEl = $('.transcriptions #' + f.feature.properties.id);
    var isWord          = transcriptionEl[0].nodeName.toUpperCase() == 'WORD';
    var wordStyle       = {
      color:       '#1676aa',
      fillOpacity: 0,
      weight:      1
    };

    var paragraphStyle = {
      color:       '#1676aa',
      fillOpacity: 0.5,
      weight:      1
    };

    resetFeatures();

    if(isWord){
      var parentFeature = features[currentImg + ''][transcriptionEl.closest('p').attr('id')];
      f.setStyle(wordStyle);
      parentFeature.setStyle(paragraphStyle);
      //iiif.fitBounds(parentFeature.getBounds());
    }
    else{
      f.setStyle(paragraphStyle);
      //iiif.fitBounds(f.getBounds());
    }
  }

  function addMiniMap(layerName) {
    if(config.miniMap && miniMapCtrls[layerName]){
      miniMapCtrls[layerName].addTo(iiif);
      setTimeout(function(){
        miniMapCtrls[layerName].fillViewport();
      }, 850);
    }
  }

  function addTranscriptions(layerName, initialise) {

    var classHideTranscript = 'transcriptions-hidden';

    if(initialise){

      $(document).on('remove-transcriptions', function(){
        transcriptionIsOn = false;
        $('#eu-iiif-container').addClass(classHideTranscript);
        resetFeatures();
        iiif.invalidateSize();
      });

      $(document).on('add-transcriptions', function(){
        log('add-transcriptions');
        transcriptionIsOn = true;
        addTranscriptions(currentImg + '');
        iiif.invalidateSize();
      });

      $(document).on('click', '.remove-transcriptions', function(){
        $(document).trigger('remove-transcriptions');
      });


      if(config.transcriptions){
        $('#eu-iiif-container').removeClass(classHideTranscript);
        transcriptionIsOn = true;
      }
      else{
        $('#eu-iiif-container').addClass(classHideTranscript);
        transcriptionIsOn = false;
      }
    }

    if(config.transcriptions){

      if(!transcriptionIsOn){
        return;
      }

      require(['jqScrollto'], function(){

        if(iiifLayers[layerName + '-f']){
          iiifLayers[layerName + '-f'].addTo(iiif);
          bindTranscriptionClick();
          updateTranscriptCtrls();
          $('#eu-iiif-container').removeClass(classHideTranscript);
        }
        else{
          loadFeatures(function(loadedLayer){
            iiifLayers[layerName + '-f'] = loadedLayer;
            loadedLayer.addTo(iiif);
            bindTranscriptionClick();
            updateTranscriptCtrls();
            $('#eu-iiif-container').removeClass(classHideTranscript);
          });
        }
      });
    }
  }


  function loadFeatures(cb) {

    var geoJsonUrl   = config.transcriptions.urls[currentImg] + '&fmt=geoJSON';
    var featureClick = function(e){

      if(!transcriptionIsOn){
        return;
      }
      highlightFeature(e.target);
      highlightTranscript($('.transcription #' + e.target.feature.properties.id));
    };

    $.getJSON(geoJsonUrl).done(function(itemJSON){

      features[currentImg + ''] = {};

      cb(Leaflet.geoJson(itemJSON, {
        style: function(){
          return {
            fillOpacity: 0.5,
            color:       'rgba(0,0,0,0)',
          };
        },
        onEachFeature: function(feature, layer){
          features[currentImg + ''][feature.properties.id] = layer;
          layer.on('click', featureClick);
        }
      }));

    });
  }

  function bindTranscriptionClick(){
    if($('.transcriptions').hasClass('js-bound')){
      return;
    }
    $(document).on('click', '.transcriptions *', function(e){
      var $t = $(this);
      e.stopPropagation();
      highlightTranscript($t);
      highlightFeature(features[currentImg + ''][$t.attr('id')]);
    });
    $('.transcriptions').addClass('js-bound');
  }

  return {
    init: function(manifestUrl, conf) {

      $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/leaflet-1.2.0/leaflet.css') + '" type="text/css"/>');
      $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/leaflet-iiif-1.2.1/iiif.css')                     + '" type="text/css"/>');

      config = $.extend({
        transcriptions: false,
        zoomSlider: true,
        pageNav: true,
        miniMap: false,
        thumbnail: false,
        fullScreenAvailable: false
      }, conf ? conf : {});

      require(['leaflet'], function(LeafletIn) {

        Leaflet = LeafletIn;

        var requirements = ['leaflet_iiif'];

        if(config.fullScreenAvailable){
          requirements.push('leaflet_fullscreen');
          $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/fullscreen/leaflet.fullscreen.css') + '" type="text/css"/>');
        }
        if(config.zoomSlider){
          requirements.push('leaflet_zoom_slider');
          $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/zoomslider/L.Control.Zoomslider.css') + '" type="text/css"/>');
        }
        if(config.miniMap){
          requirements.push('leaflet_minimap');
          $('head').append('<link rel="stylesheet" href="' + require.toUrl('../../lib/leaflet/Leaflet-MiniMap/Control.MiniMap.min.css') + '" type="text/css"/>');
        }
        require(requirements, function() {
          initViewer(manifestUrl);
        });
      });
    },
    hide: function(){
      iiif.off();
      iiif.remove();
      currentImg   = 0;
      totalImages  = 0;
      labelledData = {};
      allCanvases  = [];
      iiifLayers   = {};

      miniMapCtrls = {};
      features     = {};
    },
    remove: function(){
      if(iiif){
        iiif.off();
        iiif.remove();
      }
    },
    centre: function(){
      log('TODO: centre the image');
      //if(iiif){
      //  iiif.setView(L.latLng(0, 0), 1);
      //}
    }
  };
});
