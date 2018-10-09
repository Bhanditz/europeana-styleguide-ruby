define(['jquery', 'util_scrollEvents', 'eu_media_options', 'util_mustache_loader', 'eu_colour_nav', 'util_foldable'], function($, scrollEvents, EuMediaOptions, EuMustacheLoader, EuColourNav) {

  var channelData     = null;
  var suggestions     = null;
  var promotions      = null;
  var viewerIIIF      = null;
  var viewerPDF       = null;
  var videoPlayer     = null;
  var audioPlayer     = null;
  var nextItem        = null;
  var prevItem        = null;
  var minWidthMedia   = 400;

  var transitionEvent = (function (){
    var t;
    var res = null;
    var el = document.createElement('fakeelement');

    var transitions = {
      'transition'       :'transitionend',
      'OTransition'      :'oTransitionEnd',
      'MSTransition'     :'msTransitionEnd',
      'MozTransition'    :'transitionend',
      'WebkitTransition' :'webkitTransitionEnd'
    };

    for(t in transitions){
      if(el.style[t] !== undefined){
        res = transitions[t];
        break;
      }
    }
    return res;
  }());

  function log(msg){
    console.log('channels-object: ' + msg);
  }

  function updateTechData(el){

    var attrs = {};

    $.each(el[0].attributes, function(i, ob){
      attrs[ob.name] = ob.value;
    });

    var edmRights = el.data('edm-rights');

    if(edmRights && edmRights.model){

      $.each(Object.keys(edmRights.model), function(){
        attrs[this] = edmRights.model[this];
      });
    }

    if(attrs['data-mime-type']){
      var split = attrs['data-mime-type'].split('/');
      attrs['data-mime-type-brief'] = split.length > 0 ? split[1] : split[0];
    }

    var loadModals = function(){

      var stateRemember = ['.modal-header', '.channel-object-media-actions', '.modal-rights', '.modal-download', '.modal-share'];
      var stateRestore  = null;

      if($('.action-modal:visible').length > 0){

        stateRestore = [];

        $.each(stateRemember, function(i, ob){
          if($(ob + ':visible').length > 0){
            stateRestore.push(ob);
          }
        });
      }

      EuMustacheLoader.loadMustacheAndRender('modal-download/modal-download', attrs, function(htmlD){

        $('.modal-download').remove();

        $('.channel-object-media-actions').after(htmlD);

        $('.modal-rights:not(.inheritable-rights)').remove();
        $('.modal-rights.inheritable-license').addClass('js-hidden');

        var loadingDone = function(){

          $('#page-url-input').val(window.location.href);

          if(stateRestore){
            $.each(stateRestore, function(i, ob){
              $(ob).removeClass('js-hidden');
            });
          }
        };

        $('.object-license:not(.inheritable-license)').remove();

        if(edmRights && edmRights.model){

          EuMustacheLoader.loadMustacheAndRender('modal-rights/modal-rights', attrs, function(htmlR){

            $('.channel-object-media-actions').after(htmlR);

            EuMustacheLoader.loadMustacheAndRender('modal-rights-inheritable/modal-rights-inheritable', edmRights.model, function(htmlRights){
              $('.object-license').after(htmlRights).addClass('js-hidden');
            });
            loadingDone();
            $('.modal-rights.inheritable-rights').addClass('js-hidden');
          });
        }
        else{
          $('.object-license.inheritable-license').removeClass('js-hidden');
          $('.modal-rights.inheritable-license').removeClass('js-hidden');
          loadingDone();
        }
      });
    };

    if($('.modal-header').length === 0){
      EuMustacheLoader.loadMustacheAndRender('modal-header/modal-header', attrs, function(htmlH){
        $('.channel-object-media-actions').before(htmlH);
        $('.modal-header').append($('.object-origin').clone());
        loadModals();
      });
    }
    else{
      loadModals();
    }
  }

  function initTitleBar(cb){

    require(['eu_title_bar'], function(EuTitlebar){
      EuTitlebar.init({
        $container:        $('.header-wrapper'),
        $detectionElement: $('.object-media-viewer'),
        markup:            '<div class="title-bar"><span class="content"><span class="text-left"></span></span></div>'
      });
      cb();
    });
  }

  function actionCtrlClick(modal){
    if(modal){
      if(modal === '.modal-rights'){
        $('.action-ctrl.object-rights').click();
      }
      else{
        $('.action-modal, .channel-object-media-actions').addClass('js-hidden');
        $(modal).removeClass('js-hidden');
        $('.modal-header').attr('class', 'modal-header ' + modal.replace('.modal-', ''));
      }
    }
  }

  function scrollPageToElement(elSelector, duration, extraOffset){

    var hwh          = $('.header-wrapper').height();
    var tbh          = $('.title-bar').height();
    var scrollOffset = extraOffset - (hwh - tbh);

    require(['jqScrollto'], function(){
      $(document).scrollTo(elSelector, duration, {'offset' : scrollOffset });
    });
  }

  function initExtendedInformation(addHandler){

    var ei       = $('.channel-object-extended-information');
    var sClose   = '<span class="ctrl close"><span class="icon svg-icon-minus-bordered"></span></span>';
    var sOpen    = '<span class="ctrl  open"><span class="icon svg-icon-plus-bordered" ></span></span>';
    var keyLS    = 'eu_portal_object_data_expanded';
    var topTitle = ei.find('.channel-object-title');

    var readUserPrefs = function(){

      if(typeof(Storage) === 'undefined'){
        return;
      }

      var prefs = JSON.parse(localStorage.getItem(keyLS));

      if(!prefs){
        log('no user prefs for extended info!');
        return;
      }
      else{
        log('User prefs: ' + localStorage.getItem(keyLS));
      }

      ei.find('.data-section').each(function(i, ob){
        ob = $(ob);
        var sectionId = ob.data('section-id');
        if(prefs.indexOf(sectionId) > -1){
          $(ob).addClass('closed no-animation');
        }
        else{
          $(ob).removeClass('closed');
        }
      });
    };

    var writeUserPrefs = function(){

      if(typeof(Storage) === 'undefined'){
        return;
      }

      var closedItems = [];
      ei.find('.data-section').each(function(i, ob){
        ob = $(ob);
        if(ob.hasClass('closed')){
          closedItems.push(ob.data('section-id'));
        }
      });
      log('write userPrefs (key: ' + keyLS + ') ' + JSON.stringify(closedItems));
      localStorage.setItem(keyLS, JSON.stringify(closedItems));
    };

    var checkAllClosed = function(){
      var ac = true;
      ei.find('.data-section').each(function(i, ob){
        ob = $(ob);
        if(!$(ob).hasClass('closed')){
          ac = false;
        }
      });
      if(ac){
        topTitle.addClass('closed');
      }
      else{
        topTitle.removeClass('closed');
      }
    };

    if(!topTitle.hasClass('ctrl')){
      $(sClose).appendTo(topTitle).attr('data-before', topTitle.data('label-collapse'));
      $(sOpen).appendTo(topTitle).attr('data-before', topTitle.data('label-expand'));
    }

    ei.find('.data-section').each(function(i, ob){
      var $ob = $(ob);
      if($ob.find('.ctrl').length === 0){
        $ob.find('.subsection-label').append(sClose);
        $ob.find('.subsection-label').append(sOpen);
      }
    });

    if(addHandler){
      $(document).on('click', '.subsection-label, .channel-object-title', function(){
        var btn = $(this);
        var el  = btn.closest('.data-section');
        ei.find('.no-animation').removeClass('no-animation');

        if(el.length === 0){
          el = ei.find('.data-section').add(topTitle);
        }

        if(btn.find('.ctrl:visible').hasClass('open')){
          el.removeClass('closed');
        }
        else{
          el.addClass('closed');
        }
        writeUserPrefs();
        checkAllClosed();
      });
    }

    readUserPrefs();
    checkAllClosed();
  }

  function setZoom(zoomClass, lock){
    if(zoomClass){
      $('.object-details').addClass(zoomClass);
    }
    else{
      $('.object-details').removeClass('zoom-one zoom-two');
    }
    if(lock){
      $('.object-details').addClass('locked');
    }
  }

  function resetZoomable(){
    //setTimeout(function(){
    var zoomable = $('.zoomable');
    var limit    = false;

    if(zoomable.hasClass('busy')){
      return;
    }
    if(zoomable.hasClass('image-mode')){
      if(getColsAvailable() === 2){
        if(zoomable.closest('.zoom-one, .zoom-two').length === 0){
          limit = true;
        }
      }
    }
    zoomable.css('width', limit ? minWidthMedia + 'px' : '100%');
    //}, 1);
  }

  function isStacked(cmp, childSelector){
    var tallest = 0;

    cmp.children(childSelector).each(function(i, element) {
      var $el = $(element);
      var h   = $el.height() + 1;

      if(h > tallest){
        tallest = h;
      }
    });
    return cmp.height() > tallest;
  }

  function getColsAvailable(){
    return Math.round(parseFloat(getComputedStyle($('.object-details')[0], ':after')['width']));
  }

  function getZoomLevels(){

    var colsAvailable   = getColsAvailable();
    var current         = $('.cho-media-nav a.is-current');
    var availableLevels = colsAvailable === 1 ? ['zoom-two'] : ['zoom-one', 'zoom-two'];

    if(current.data('type') === 'image'){

      var zoomLevelsNeeded = colsAvailable;
      var naturalWidth     = current.data('natural-width');
      var sizes            = getComputedStyle($('.object-details')[0], ':after')['content'];
      sizes                = sizes.replace(/\"/g, '').split(',');
      zoomLevelsNeeded     = 0;

      if(colsAvailable === 1){
        if(naturalWidth > $('.object-media-viewer').width()){
          zoomLevelsNeeded ++;
        }
      }
      else{
        $.each(sizes, function(i, size){
          var pxSize = size.indexOf('px') > -1 ? parseInt(size) : parseInt(size) * 16;

          if(naturalWidth > pxSize){
            zoomLevelsNeeded ++;
          }
        });
      }
      return availableLevels.slice(0, Math.min(colsAvailable, zoomLevelsNeeded));
    }
    else{
      return availableLevels.slice(0, colsAvailable);
    }
  }

  function bindMediaUI(){

    $(window).europeanaResize(function(){

      if($('.object-details').hasClass('locked')){

        var zoomLevels = getZoomLevels();

        if(zoomLevels.indexOf('zoom-one') === -1){
          $('.object-details').removeClass('zoom-one');
        }
        else if(EuMediaOptions.zoomOutLimited()){
          $('.object-details').addClass('zoom-one');
        }

        if(zoomLevels.indexOf('zoom-two') === -1){
          $('.object-details').removeClass('zoom-two');
        }
      }
      else{
        $('.object-details').removeClass('zoom-one').removeClass('zoom-two');
      }
      resetZoomable();
    });

    var $zoomEl   = $('.object-details');
    var zoomIn    = $('.media-zoom-in');
    var zoomOut   = $('.media-zoom-out');

    zoomIn.on('click', function(){

      if(zoomIn.hasClass('disabled')){
        return;
      }
      if($zoomEl.hasClass('js-busy')){
        return;
      }
      else{
        $zoomEl.addClass('js-busy');
        var zoomLevels = getZoomLevels();
        if($zoomEl.hasClass('zoom-one') && zoomLevels.length > 1){
          $zoomEl.addClass('zoom-two');
          resetZoomable();
        }
        else{
          $zoomEl.addClass(zoomLevels[0]);
          resetZoomable();
        }
      }
    });

    zoomOut.on('click', function(){

      if(zoomOut.hasClass('disabled')){
        return;
      }
      if($zoomEl.hasClass('js-busy')){
        return;
      }
      else{
        $zoomEl.addClass('js-busy');

        if($zoomEl.hasClass('zoom-two')){
          $zoomEl.removeClass('zoom-two');
        }
        else{
          $zoomEl.removeClass('zoom-one');
        }
      }
      resetZoomable();
    });

    EuMediaOptions.init($('.media-options'), {'external-link': $('.object-origin').data('object-origin-url'), 'share-link': true});

    EuMediaOptions.addHandler('iiif', function(ops){
      if(ops['transcriptions-active']){
        setZoom('zoom-one zoom-two', true);
        resetZoomable();
      }
    });

    $('.media-share').on('click', function(){
      console.log('share');
    });

    $('.media-link').on('click', function(){
      console.log('link');
    });

    $('.action-ctrl.object-rights').on('click', function(){

      $('.action-modal').addClass('js-hidden');
      $('.channel-object-media-actions').addClass('js-hidden');

      var nonDefaultRights = $('.modal-rights:not(.inheritable-rights)');
      if(nonDefaultRights.length > 0){
        nonDefaultRights.removeClass('js-hidden');
      }
      else{
        $('.modal-rights').removeClass('js-hidden');
      }

      $('.modal-header').attr('class', 'modal-header rights');
    });

    $(document).on('click', '.action-ctrl-btn', function(e){
      var tgt   = $(e.target).closest('.action-ctrl-btn');
      var modal = tgt.data('modal-selector');
      actionCtrlClick(modal);
    });

    $(document).on('click', '.media-modal-close', function(e){
      $(e.target).closest('.action-modal').addClass('js-hidden');
      $('.modal-header').addClass('js-hidden');
      $('.channel-object-media-actions').removeClass('js-hidden');
    });
  }

  function initMedia(index){
    var item        = $('.cho-media-nav .lc-item:eq(' + index + ') a');
    var type        = item.data('type');
    var downloadUri = item.data('download-uri');
    var omv         = $('.object-media-viewer');
    var playable    = item.hasClass('playable');
    var thumbnail   = item.data('thumbnail');
    var uri         = item.data('uri');
    var mimeType    = item.data('mime-type');

    $('.cho-media-nav .lc-item .mlt-img-div').removeClass('active');
    $('.cho-media-nav .lc-item .is-current').removeClass('is-current');

    item.closest('.mlt-img-div').addClass('active');
    item.addClass('is-current');

    updateTechData(item);
    EuColourNav.updateColourData();

    $('.media-options').trigger(type, $.extend(type === 'iiif' ? {'transcriptions-unavailable': true} : {}, {'download-link': downloadUri}));

    var reminderImg = $('.title-bar .img-remind');

    if(reminderImg.length === 0){
      reminderImg = $('<img class="img-remind">').appendTo($('.title-bar .content'));
    }
    reminderImg.attr('src', thumbnail);

    reminderImg.off('click').on('click', function(){
      scrollPageToElement('.media-poster', 333, -16);
    });

    $('.title-bar .text-left').text($('.channel-object-title:eq(0)').text());

    var removeOldMedia = function(){

      $('.zoomable .object-media-oembed').remove();
      $('.zoomable > img').remove();
      $('.zoomable').children().addClass('is-hidden');
      $('.zoomable').children().not('.object-media-audio').detach().appendTo(omv);

      if(audioPlayer){
        audioPlayer.hide();
      }

      if(videoPlayer){
        videoPlayer.hide();
      }

      if(viewerIIIF){
        viewerIIIF.hide();
        viewerIIIF = null;
      }

      if(viewerPDF){
        viewerPDF.hide();
      }
    };

    var setZoomedLock = function(){
      if($('.zoom-one').length > 0 || !isStacked(omv, '.media-poster, .channel-object-media-nav')){
        setZoom('zoom-one', true);
      }
      else{
        setZoom(null, true);
      }
    };

    var showDefault = function(){

      require(['jqImagesLoaded'], function(){

        removeOldMedia();

        $('<img src="' + thumbnail + '">').appendTo('.zoomable').imagesLoaded(function(){
          if($(this)[0].naturalHeight > minWidthMedia){
            omv.addClass('thumbnail-tall');
          }
        });
        omv.addClass('thumbnail-mode');

        setZoom();

        log('not playable');

        resetZoomable();
        $('.media-options').trigger('hide');
      });
    };

    if(playable){
      if(type !== 'audio'){
        omv.removeClass('thumbnail-mode thumbnail-tall');
      }
    }
    else{
      showDefault();
      return;
    }

    if(type !== 'image'){
      $('.zoomable').removeClass('image-mode');
    }
    if(type === 'image'){

      var showImage = function(){

        var initW = Math.min(minWidthMedia, $('.zoomable > img').width());

        removeOldMedia();
        updateCtrls();

        $('.zoomable').addClass('busy').css('width', initW);
        $('<img style="background-image:url(' + thumbnail + '); display:block; margin:auto; width:' + initW + 'px;">').appendTo('.zoomable').attr('src', uri);

        setTimeout(function(){
          $('.zoomable > img').removeAttr('style');
          $('.zoomable').removeClass('busy');
          resetZoomable();
        }, 333);
      };

      $('.zoomable').addClass('image-mode');

      setZoom();

      $('.object-details').removeClass('locked');

      // if(!isStacked(omv, '.media-poster, .channel-object-media-nav')){
      //  $('.zoomable').css('width', minWidthMedia + 'px');
      // }

      if(item.data('natural-width')){
        showImage();
      }
      else{
        require(['jqImagesLoaded'], function(){

          $('body').append('<img id="img-measure" style="display:none;" src="' + uri + '">').imagesLoaded(function(){

            var tryInit = function(attempt){
              var nWidth = $('#img-measure')[0].naturalWidth;

              if(nWidth > 0){
                item.data('natural-width', nWidth);
                $('#img-measure').remove();
                showImage();
              }
              else{
                if(attempt > 5){
                  log('give up on image: ' + uri);
                  showDefault();
                }
                else{
                  log('retry for image...');
                  setTimeout(function(){ tryInit(attempt + 1); }, 100);
                }
              }
            };
            tryInit(1);
          });
        });
      }
    }
    else if(type === 'iiif'){

      removeOldMedia();

      $('.zoomable').append($('.object-media-iiif'));

      setZoomedLock();
      updateCtrls();
      resetZoomable();

      var fsAvailable = function(){
        var db = document.body;
        return db.requestFullScreen
        || db.webkitRequestFullscreen
        || db.webkitRequestFullscreen
        || db.mozRequestFullScreen
        || db.mozRequestFullScreen
        || db.msRequestFullscreen
        || db.msRequestFullscreen;
      };

      var useTranscriptions = uri.indexOf('://iiif.europeana.eu/presentation/') > -1;
      var borderH           = 6.2;
      var useMiniMap        = useTranscriptions;
      var useZoomSlider     = !useTranscriptions;
      var sizesMiniMap      = { l: { w: 316,   h: 465 }, s: {w: 206, h: 304} };
      var sizesMiniMapTools = { l: borderH + 42.06, s: borderH + 30.72 };

      var fnMiniMapData = function(){

        var tooSmall = $(window).width() < 800;
        var cr       = false;
        return {
          h: tooSmall ? 0 : cr ? sizesMiniMap['l']['h'] : sizesMiniMap['s']['h'],
          w: tooSmall ? 0 : cr ? sizesMiniMap['l']['w'] : sizesMiniMap['s']['w'],
          t: cr ? sizesMiniMapTools['l'] : sizesMiniMapTools['s'],
          ctrlsClass: cr ? 'large' : ''
        };
      };

      require(['media_viewer_iiif', 'purl'], function(viewer) {

        var conf = {
          transcriptions:  useTranscriptions,
          miniMap: useMiniMap ? {
            fillViewport:  true,
            toggleDisplay: false,
            position:      'topright',
            mapOptions:    { setMaxBounds: true },
            fnMiniMapData: fnMiniMapData
          } : false,
          pageNav: true,
          searchTerm: $.url(decodeURI(window.location.href)).param()['q'],
          thumbnail: thumbnail,
          fullScreenAvailable: fsAvailable(),
          zoom: 4,
          zoomLevelOffset: -1,
          zoomSlider: useZoomSlider
        };

        viewerIIIF = viewer;
        viewerIIIF.init(uri, conf);
        $('.object-media-iiif').removeClass('is-hidden');
      });
    }
    else if(type === 'audio'){

      omv.addClass('thumbnail-mode');

      removeOldMedia();
      setZoom();

      require(['media_viewer_videojs'], function(player) {

        audioPlayer = player;

        EuMustacheLoader.loadMustache('media-audio/media-audio', function(html){

          $('.object-media-audio').remove();
          $('.zoomable').append(html);

          var media = {
            url:       uri,
            data_type: type,
            mime_type: mimeType,
            thumbnail: thumbnail,
            height:    ((typeof thumbnail === 'undefined' || !thumbnail) ? '70' : minWidthMedia) + 'px'
          };

          if(media.url && media.mime_type){
            player.init(media);
          }
          else{
            console.log('invalid audio:\n\t' + JSON.stringify(media, null));
          }
          resetZoomable();
        });
      });
    }
    else if(type === 'video'){

      removeOldMedia();
      setZoomedLock();
      resetZoomable();

      EuMustacheLoader.loadMustacheAndRender('media-video/media-video', {'video': true}, function(html){

        $('.zoomable').append(html);
        $('.object-media-video').removeClass('is-hidden');

        require(['media_viewer_videojs'], function(player){

          videoPlayer = player;
          var media = {
            url:       uri,
            data_type: type,
            mime_type: mimeType,
            thumbnail: thumbnail,
            height:    minWidthMedia + 'px'
          };

          if(media.url && media.mime_type){
            videoPlayer.init(media);
          }

        });
      });
    }
    else if(type === 'oembed'){

      removeOldMedia();

      EuMustacheLoader.loadMustacheAndRender('media-oembed/media-oembed', {}, function(html){

        $('.zoomable').append(html);
        var container = $('.zoomable .object-media-oembed').removeClass('is-hidden');

        setZoomedLock();
        updateCtrls();
        resetZoomable();

        require(['media_player_oembed'], function(viewer){
          viewer.init(container, unescape(item.data('html')));
        });

      });

    }
    else if(type === 'pdf'){

      removeOldMedia();
      setZoomedLock();
      updateCtrls();
      resetZoomable();

      require(['pdfjs'], function(){
        require(['pdf_lang'], function(){
          require(['media_viewer_pdf'], function(viewer){

            var elPDF = $('.object-media-pdf');

            var doWhenMarkupLoaded = function(){

              elPDF.removeClass('is-hidden');

              if(!viewerPDF){
                viewerPDF = viewer;
              }
              else{
                viewerPDF.show();
              }
              viewerPDF.init(uri);
            };

            if(elPDF.length > 0){
              $('.zoomable').append(elPDF);
              doWhenMarkupLoaded();
            }
            else{
              EuMustacheLoader.loadMustache('media-pdf/media-pdf', function(html){
                $('.zoomable').append(html);
                elPDF = $('.object-media-pdf');
                doWhenMarkupLoaded();
              });
            }
          });
        });
      });
    }
    else{
      log('type not implemented: ' + type);
      removeOldMedia();
    }

    if(downloadUri){
      $('.media-download').attr('href', downloadUri);
      $('.media-download').removeClass('disabled');
    }
    else{
      $('.media-download').removeAttr('href');
      $('.media-download').addClass('disabled');
    }
  }

  function initActionBar(){
    $('.media-annotate').on('click', function(){ console.log('annotate'); });

    $(document).on('click', '.media-options .media-download, .media-options .media-share', function(e){

      var tgt   = $(e.target).closest('.media-option');
      var modal = tgt.data('modal-selector');

      actionCtrlClick(modal);
      scrollPageToElement('.channel-object-action-bar', 0, - 36);
    });
  }

  function initEntity() {

    $('.channel-object-viewmore [data-deref]').each(function() {

      var dRef = $(this);
      var url  = dRef.data('deref');
      var req  = new XMLHttpRequest();

      req.onreadystatechange = function() {
        if(req.readyState === 4){
          $.getJSON(req.responseURL.indexOf('.json') > -1 ? req.responseURL : url).done(function(data) {

            var depiction = data.api_response.depiction ? data.api_response.depiction.id ? data.api_response.depiction.id : false : false;
            var imageEl   = dRef.find('.viewmore-image');

            if(depiction){
              imageEl.css('background-image', 'url("' + depiction + '")');
            }
          });
        }
      };
      req.open('GET', url, true);
      req.send();
    });
  }

  function updateCtrls(){
    $(window).trigger('eu-slide-update');
    $(window).trigger('ellipsis-update');

    var $zoomEl    = $('.object-details');
    var zoomIn     = $('.media-zoom-in');
    var zoomOut    = $('.media-zoom-out');
    var zoomLevels = getZoomLevels();

    if(zoomLevels.indexOf('zoom-two') > -1 && !$zoomEl.hasClass('zoom-two') || zoomLevels.indexOf('zoom-one') > -1 && !$zoomEl.hasClass('zoom-one')){
      zoomIn.removeClass('disabled');
    }
    else{
      zoomIn.addClass('disabled');
    }

    if($zoomEl.hasClass('zoom-two')){
      zoomOut.removeClass('disabled');
    }
    else if($zoomEl.hasClass('zoom-one')){
      if(zoomLevels.length === 2){

        if(EuMediaOptions.zoomOutLimited()){
          zoomOut.addClass('disabled');
        }
        else{
          zoomOut.removeClass('disabled');
        }
      }
      else if(zoomLevels.length === 1){

        if(zoomLevels.indexOf('zoom-two') === -1){
          zoomOut.removeClass('disabled');
        }
        if(zoomLevels.indexOf('zoom-one') > -1){
          zoomOut.removeClass('disabled');
        }
      }
      else{
        // no zoom levels but we have zoom-one applied: user has resized to narrow
        zoomOut.removeClass('disabled');
      }
    }
    else{
      zoomOut.addClass('disabled');
    }
    $zoomEl.removeClass('js-busy');
  }

  function fixZoomableWidth(){

    var zoomable = $('.zoomable');

    if(zoomable.hasClass('busy')){
      return;
    }

    zoomable.off(transitionEvent);
    zoomable.css('width', zoomable.width() + 'px');

    setTimeout(function(){
      zoomable.on(transitionEvent, function(e){
        if(e.originalEvent.propertyName === 'width'){
          if($(e.target).hasClass('zoomable')){
            updateCtrls();
            fixZoomableWidth();
            $(window).trigger('refresh-leaflet-map');
          }
        }
      });
    }, 1);
  }

  function loadAnnotations(){

    if(window.annotationsLater){
      $.getJSON(location.href.split('.html')[0].split('?')[0] + '/annotations.json', null).done(function(data){
        if(data){
          data.extended_information = true;
          data.id                   = 'annotations';
          EuMustacheLoader.loadMustacheAndRender('sections-object-data-section/sections-object-data-section', data, function(html){
            $('#annotations').after(html);
            initExtendedInformation(true);
          });
        }
        else{
          initExtendedInformation(true);
        }
      }).fail(function(){
        initExtendedInformation(true);
      });
    }
    else{
      initExtendedInformation(true);
    }
  }

  function loadHierarchy(params, callbackOnFail){

    var href    = location.href;
    var baseUrl = href.split('/record')[0] + '/record';
    var initUrl = href.split('.html')[0];

    initUrl  = href.replace('.html', '').split('?')[0];
    initUrl += '/hierarchy/ancestor-self-siblings.json';

    var error = function(msg){
      log('hierarchy error: ' + msg);
      $('.hierarchy-objects').closest('.data-border').addClass('js-hidden');
      callbackOnFail();
    };

    var buildHierarchy = function(initialData){

      if(initialData && (initialData.error !== null || ! initialData.success )){
        error(initialData.error);
        return;
      }

      require(['jsTree'], function(){
        require(['eu_hierarchy'], function(Hierarchy){

          var css_path_1 = require.toUrl('../../lib/jstree/css/style.css');
          var css_path_2 = require.toUrl('../../lib/jstree/css/style-overrides.css');

          $('head').append('<link rel="stylesheet" href="' + css_path_1 + '" type="text/css"/>');
          $('head').append('<link rel="stylesheet" href="' + css_path_2 + '" type="text/css"/>');

          var markup = ''
          + '<div class="hierarchy-top-panel uninitialised">'
          + '  <div class="hierarchy-prev"><a>' + params.label_up + '</a><span class="count"></span></div>'
          + '  <div class="hierarchy-title"></div>'
          + '</div>'
          + '<div class="hierarchy-container uninitialised">'
          + '  <div id="hierarchy"></div>'
          + '</div>'
          + '<div class="hierarchy-bottom-panel">'
          + '  <div class="hierarchy-next"><a>' + params.label_down + '</a><span class="count"></span></div>'
          + '</div>';

          $('.hierarchy-objects').html(markup);
          var hierarchy = Hierarchy.create(
            $('#hierarchy'),
            16,
            $('.hierarchy-objects'),
            baseUrl,
            baseUrl
          );
          $('.hierarchy-objects').removeAttr('style');
          hierarchy.init(initialData, true);
        });
      });
    };
    $.getJSON(initUrl, null).done(buildHierarchy).fail(error);
  }

  function showMap(){
    require(['util_cho_map'], function(MapUtil){
      MapUtil.loadMap($('.markers a'));
    });
  }

  function updateSlideNavCtrls(EuSlide, cmp, fwd, back){

    if(cmp.children().length === 1){
      fwd.addClass('disabled');
      back.addClass('disabled');
    }
    else{
      var nav = EuSlide.getNavOptions(cmp);

      if(nav[0]){
        fwd.removeClass('disabled');
      }
      else{
        fwd.addClass('disabled');
      }
      if(nav[1]){
        back.removeClass('disabled');
      }
      else{
        back.addClass('disabled');
      }
    }
  }

  function initPromos(EuSlide){

    var fwd  = $('.channel-object-actions .eu-slide-nav-right');
    var back = $('.channel-object-actions .eu-slide-nav-left');

    fwd.data('dir', 1);
    back.data('dir', -1);

    var navClick = function(){
      if(promotions.length > 0){
        EuSlide.simulateSwipe(promotions, $(this).data('dir'), null, function(){ updateSlideNavCtrls(EuSlide, promotions, fwd, back); });
      }
    };

    back.on('click', navClick);
    fwd.on('click', navClick);

    promotions.updateSwipe = function(){
      var totalW = (promotions.children().length - 1) * 32;
      totalW = totalW + promotions.children('.separator-after, .separator-before').length * 32;

      promotions.children('.collections-promo-item').each(function(){
        totalW = totalW + $(this).outerWidth();
      });
      promotions.css('width', totalW + 'px');
      updateSlideNavCtrls(EuSlide, promotions, fwd, back);
    };

    promotions.css('width', '5000px');
    promotions.on('eu-swiped', function(){
      updateSlideNavCtrls(EuSlide, promotions, fwd, back);
    });
    EuSlide.makeSwipeable(promotions, {'not-on-stacked': true, 'transition-on-simulate': true});

    if(typeof(Storage) !== 'undefined') {

      var s = sessionStorage;

      promotions.find('.channel-object-next-prev.object-next a').on('click', function(){
        if(!$(this).data('bound-unload')){
          $(this).data('bound-unload', true);
          $(window).on('unload', function(){
            var current = parseInt(s.eu_portal_last_results_current);
            s.eu_portal_last_results_current = current + 1;
            log('on unload (NEXT): update current to ' + s.eu_portal_last_results_current);
          });
        }
      });

      promotions.find('.channel-object-next-prev.object-prev a').on('click', function(){
        if(!$(this).data('bound-unload')){
          $(this).data('bound-unload', true);
          $(window).on('unload', function(){
            var current = parseInt(s.eu_portal_last_results_current);
            s.eu_portal_last_results_current = current - 1;
            log('on unload (PREV): update current to ' + s.eu_portal_last_results_current);
          });
        }
      });
    }

    var imageSet = promotions.find('.image-set');

    if(imageSet.length > 0){

      require(['jqImagesLoaded'], function(){

        imageSet.imagesLoaded(function(){

          var portraits = [];

          promotions.find('img').each(function(i, img){
            if(i>0){
              portraits.push(img.naturalHeight > img.naturalWidth);
            }
          });

          if(portraits[0] && !portraits[1]){
            imageSet.addClass('layout-portrait');
          }
        });
      });
    }

    var applyEllipsis = function(){

      require(['util_eu_ellipsis'], function(Ellipsis){

        promoBoxes.find('.promo-title').each(function(i, ob){
          Ellipsis.create($(ob), {textSelectors:['a']});
        });

        promoBoxes.find('.image-set-title').each(function(i, ob){
          Ellipsis.create($(ob));
        });

        promoBoxes.find('.promo-tags').each(function(i, ob){
          Ellipsis.create($(ob), {multiNode:true, textSelectors:['.promo-tag-link']});
        });

        promoBoxes.find('.text-main').each(function(i, ob){
          ob = $(ob);
          ob.html(ob.text());
          Ellipsis.create(ob);
        });

        promoBoxes.find('.collections-promo-overlay .title').each(function(i, ob){
          Ellipsis.create(ob);
        });

      });
    };

    var promoBoxes        = promotions.find('.collections-promo-item');
    var promoBoxesGeneric = promotions.find('.collections-promo-item.generic-promo');

    if(promoBoxesGeneric.length > 0){
      require(['jqImagesLoaded'], function(){
        promoBoxesGeneric.each(function(i, ob){
          ob = $(ob);
          ob.imagesLoaded(function($images){
            var textEl        = ob.find('.content-text-inner');
            var textMain      = ob.find('.text-main');

            var hasPortrait         = $images[0].naturalHeight > $images[0].naturalWidth;
            var hasDateAuthorOrType = !textEl.hasClass('no-date-and-type');
            var hasTags             = textEl.hasClass('has-tags');
            var hasTitle            = textEl.hasClass('has-title');
            var hasTitleShort       = hasTitle && (ob.find('.promo-title a').text().length < 20);
            var hasText             = textEl.hasClass('has-text');
            var hasTextShort        = hasText && (textMain.text().length < 25);
            var hasRelation         = !textMain.hasClass('no-relation');

            ob.find('.js-remove').remove();

            var score = 0;

            if(hasPortrait){
              score += 75;
            }
            else{
              //score += 38;
              score += 75;
            }

            if(hasTitle){
              if(hasTitleShort){
                score += 7;
              }
              else{
                score += 14;
              }
            }
            if(hasText){
              if(hasTextShort){
                score += 7;
              }
              else{
                score += 21;
              }
            }
            if(hasRelation){
              score += 7;
            }
            if(hasTags){
              score += 8;
            }
            if(hasDateAuthorOrType){
              score += 10;
            }

            /*
            log('card data summary:\n'
              + hasPortrait         + '\t hasPortrait\n'
              + hasDateAuthorOrType + '\t hasDateAuthorOrType\n'
              + hasTags             + '\t hasTags\n'
              + hasTitle            + '\t hasTitle\n'
              + hasTitleShort       + '\t hasTitleShort\n'
              + hasText             + '\t hasText\n'
              + hasTextShort        + '\t hasTextShort\n'
              + hasRelation         + '\t hasRelation\n\n\t'
              + score               + '%');
            */

            if(score > 100){
              ob.addClass('text-centric');
            }

          }); // end img loaded
        }); // end each
        applyEllipsis();
      });
    }
    else{
      if(promoBoxes.length > 0){
        applyEllipsis();
      }
    }

    var promoOverlays = promotions.find('.collections-promo-item.entity-promo .collections-promo-overlay-inner');
    if(promoOverlays.length > 0){
      promoOverlays.each(function(i, ob){
        ob = $(ob);
        var nText = ob.contents().filter(function(){
          return this.nodeType === 3;
        });
        var newVal = nText[nText.length-1].nodeValue.replace(/\s+/, '');
        newVal = newVal.slice(0, 100) + (newVal.length > 100 ? '...' : '');
        nText[nText.length-1].nodeValue = newVal;
      });
    }
  }

  function makePromoRequest(){

    require(['util_promo_loader'], function(PromoLoader){

      var promoTemplates = {
        'exhibition': 'template-promo-exhibition',
        'gallery': 'template-promo-gallery',
        'news': 'template-promo-news',
        'entity': 'template-promo-entity',
        'generic': 'template-promo-generic'
      };

      var promoConf = [];

      if((typeof window.enabledPromos).toUpperCase() === 'OBJECT'){
        $.each(window.enabledPromos, function(i, promo){
          var mapping = null;
          var tempId  = promo.id;

          if(promo.id === 'blog'){
            tempId  = 'generic';
            mapping = PromoLoader.getMappingFunctions()['fnBlogToGeneric'];
          }
          var conf    = { id: promo.id, templateId: promoTemplates[tempId], url: promo.url, mapping: mapping };
          promoConf.push(conf);

          if(promo.relation){
            conf.relation = promo.relation;
          }
        });
      }

      if(nextItem){
        nextItem.is_next = true;
        promoConf.unshift({
          'id': 'next',
          'preloaded': nextItem,
          'templateId': 'template-promo-next-prev'
        });
      }

      if(prevItem){
        prevItem.is_prev = true;
        promoConf.push({
          'id': 'previous',
          'preloaded': prevItem,
          'templateId': 'template-promo-next-prev'
        });
      }

      if(promoConf.length === 0){
        $('.collections-promo-item-preload').remove();
        console.log('no promos to load');
        return;
      }

      EuMustacheLoader.loadMustache('cho-promotions/cho-promotions', function(templateMarkup){

        templateMarkup = $('<template>' + templateMarkup + '</template>' );
        templateMarkup = $(templateMarkup.prop('content'));

        PromoLoader.load(promoConf, templateMarkup, function(markup){

          if(markup && markup.length > 0){

            markup.addClass('collections-promos js-swipe-not-stacked');

            $('.channel-object-actions .slide-rail').empty().append(markup);

            promotions = $('.collections-promos');
            $(window).trigger('promotionsAppended');

            require(['util_slide'], function(EuSlide){
              initPromos(EuSlide);

              // is this needed now that adding promos no longer changes column count?
              $(window).trigger('carouselResize');
            });

            var foyerCards = $('.ve-foyer-card');

            if(foyerCards.length > 0){
              require(['ve_state_card'], function(Card){
                foyerCards.each(function(){
                  new Card($(this), {slideshow: false});
                });
              });
            }

            // is this needed now that adding promos no longer changes column count?
            resetZoomable();
          }
          else{
            console.log('no promo markup returned');
            // $('.channel-object-actions .slide-rail').empty();
            // $('.object-details').removeClass('has-right-column').addClass('no-right-column');
            // $(window).resize();
          }
        });

      });

    });
  }

  function convertDataResultToNav(arr, params){

    var res     = [];
    var sParams = null;

    if(arr.length > 0){
      params  = $.extend($.url(decodeURI(arr[0].url)).param(), params);
      delete params['l'];
      sParams = '?' + $.param(params);
    }
    for(var i=0; i<arr.length; i++){
      var item = arr[i];
      res.push({
        'url': item['object_url'].split('?')[0] + sParams,
        'media_type': item.media_type,
        'img': item.img,
        'title': item.title,
        'excerpt': (item.text ? item.text.medium : ''),
        'relation': 'What goes here? (relation)'
      });
    }
    return res;
  }

  function getNavDataBasic(searchUrl, params, callback){

    var s = sessionStorage;

    var fixOffset = function(){
      var per_page = params['per_page'] ? parseInt(params['per_page']) : 12;
      var page     = params['page'] ? parseInt(params['page']) : 1;
      var offset   = (per_page * page) - per_page;
      s.eu_portal_last_results_offset = offset;

      log('write offset (1) ' + offset);
    };

    $.getJSON(searchUrl + $.param(params)).done(function(data){

      if(!data){
        log('no data');
      }

      s.eu_portal_last_results_total = data.total.value;

      data = convertDataResultToNav(data['search_results'], params);

      var currUrl  = location.href.split('?')[0].split(location.host)[1];
      var currItem = null;

      for(var i=0; i<data.length; i++){

        if(!currItem && data[i].url.split('?')[0] === currUrl){
          currItem = i;
          s.eu_portal_last_results_current = currItem;
          fixOffset();
        }
      }
      s.eu_portal_last_results_items = JSON.stringify(data);
      callback();
    });
  }

  function getNextPrevItems(callback, searchUrl, params){

    var s           = sessionStorage;
    var per_page    = params['per_page'] ? parseInt(params['per_page']) : 12;
    var page        = params['page'] ? parseInt(params['page']) : 1;
    var from        = ((page - 1) * per_page) + 1;
    var items       = s.eu_portal_last_results_items ? JSON.parse(s.eu_portal_last_results_items) : [];
    var count       = items.length;
    var current     = s.eu_portal_last_results_current ? parseInt(s.eu_portal_last_results_current) : null;
    var total       = s.eu_portal_last_results_total ? parseInt(s.eu_portal_last_results_total) : null;
    var offset      = parseInt(s.eu_portal_last_results_offset);
    var offsetIndex = ((page * per_page) - per_page) - offset;

    var nextNeeded  = ((offsetIndex + current + 1) === count) && (offsetIndex + current + 1) < total;
    var prevNeeded  = (offsetIndex + current) === 0 && from > 1;

    if(!(history.state && typeof history.state.currentIndex === 'number')){
      log('write state ' + current);
      history.replaceState({
        'currentIndex': current
      }, '', '');
    }

    log('nextNeeded = ' + nextNeeded + ', prevNeeded = ' + prevNeeded + ', offset = ' + offset + ', offsetIndex = ' + offsetIndex);

    if(nextNeeded){
      prevItem = items[offsetIndex + current - 1];
    }
    if(prevNeeded){
      nextItem = items[offsetIndex + current + 1];
    }

    if(!(nextNeeded || prevNeeded)){
      var indexPrev = offsetIndex + current - 1;
      prevItem      = items[indexPrev];
      var indexNext = offsetIndex + current + 1;
      nextItem      = items[indexNext];
      callback();
      return;
    }

    params['page'] = page + (nextNeeded ? 1 : -1);

    log('will search on ' + (searchUrl + $.param(params)));

    $.getJSON(searchUrl + $.param(params)).done(function(data){

      if(data){
        data = convertDataResultToNav(data['search_results'], params);
      }
      else{
        log('no nav data available');
        callback();
        return;
      }

      if(nextNeeded){
        items    = items.concat(data);
        nextItem = items[offsetIndex + current + 1];
      }
      else{
        items  = data.concat(items);
        offset = offset - data.length;

        log('write offset (2) ' + offset);

        s.eu_portal_last_results_offset = offset;
        prevItem = items[data.length - 1];
      }
      s.eu_portal_last_results_items = JSON.stringify(items);
      callback();
    });
  }

  function initSuggestions(EuSlide){
    suggestions.css('width', '5000px');

    EuMustacheLoader.loadMustache('cho-suggestions-item/cho-suggestions-item', function(template, Mustache){

      require(['eu_accordion_tabs', 'util_eu_ellipsis'], function(EUAccordionTabs, Ellipsis){

        var back = $('.suggestions-section .eu-slide-nav-left');
        var fwd  = $('.suggestions-section .eu-slide-nav-right');

        var updateActiveSwipeableNav = function(){
          var activeSwipeable = $('.suggestions .tab-content.active .js-swipeable');
          if(activeSwipeable.length > 0){
            updateSlideNavCtrls(EuSlide, activeSwipeable, fwd, back);
          }
        };

        back.data('dir', -1);
        fwd.data('dir', 1);

        EUAccordionTabs.init(suggestions, {
          active: 0,
          fnOpenTab: function(){
            $(window).trigger('ellipsis-update');
            updateActiveSwipeableNav();
          },
          lockTabs: true
        });

        EUAccordionTabs.loadTabs(
          suggestions,
          function(data, tab){

            tab = $(tab);

            tab.find('.tab-subtitle .results-count').html('');
            tab.find('.tab-subtitle .results-label').addClass('js-hidden');

            if(data.total){
              tab.find('.tab-subtitle .results-count').html(Number(data.total).toLocaleString());
              if(parseInt(data.total) === 1){
                tab.find('.tab-subtitle .results-label.single').removeClass('js-hidden');
              }
              else{
                tab.find('.tab-subtitle .results-label.plural').removeClass('js-hidden');
              }
            }

            var slideContent = tab.next('.tab-content').find('.slide-content');

            $.each(data.documents, function(i, itemData){
              slideContent.append(Mustache.render(template, itemData));
            });

            slideContent.updateSwipe = function(){
              var totalW = 0;
              slideContent.children().each(function(i, ob){
                totalW += $(ob).outerWidth();
              });
              slideContent.css('width', totalW + 'px');
              return totalW;
            };
            EuSlide.makeSwipeable(slideContent, {'transition-on-simulate': true});
            slideContent.on('eu-swiped', updateActiveSwipeableNav);
            return data;
          },
          function(data, tab, index, completed){

            var ellipsisConf = {textSelectors:['a .link-text']};
            var tabContent   = $(tab).next('.tab-content');
            var texts        = tabContent.find('.suggestion-item .item-info h2');

            texts.each(function(i, ob){
              Ellipsis.create($(ob), ellipsisConf);
            });

            if(completed){

              suggestions.closest('.slide-rail').css('left', '0px');

              suggestions.updateSwipe = function(){

                EUAccordionTabs.setOptimalSize(suggestions);

                setTimeout(function(){
                  updateActiveSwipeableNav();
                }, 1);
              };

              var navClick = function(){
                var activeSwipeable = $('.suggestions .tab-content.active .js-swipeable');
                if(activeSwipeable.length > 0){
                  EuSlide.simulateSwipe(activeSwipeable, $(this).data('dir'), null, updateActiveSwipeableNav);
                }
              };

              back.on('click', navClick);
              fwd.on('click', navClick);
              EuSlide.makeSwipeable(suggestions);
            }
          }
        );
        suggestions.addClass('loaded');
      });
    });
  }

  var showMediaThumbs = function(data){

    var noItems = $('.channel-object-media-nav .lc-item').length;

    if(noItems > 1){

      require(['eu_light_carousel'], function(EuLC){

        var $el = $('.light-carousel.media-thumbs');

        EuMustacheLoader.loadMustache('media-carousel-item/media-carousel-item', function(html){

          new EuLC.EuLightCarousel({
            '$el': $el,
            'loadUrl': data.loadUrl,
            'load_per_page': 8, // has to be in sync with number preloaded
            'itemsAvailable': data.total_available,
            'templateText': html,
            'onDataLoaded': EuColourNav.addColourDataFromAjax
          }).init();

          if(typeof ResizeObserver === 'undefined'){
            setTimeout(function(){
              $el.find('.lc-scrollable').trigger('carousel-scrolled');
            }, 2500);
          }

          $('.cho-media-nav').on('click', 'a', function(e){
            e.preventDefault();
            var el = $(this);
            initMedia(el.closest('.lc-item').index());
          });

          fixZoomableWidth();

          setTimeout(function(){
            $('.channel-object-media-nav').removeClass('js-hidden');
          }, 400);
        });
      });
    }
    else{
      $('.channel-object-media-nav').css({
        'height': 0,
        'width':  0
      });
      fixZoomableWidth();
    }
  };

  var channelCheck = function(){
    if(typeof(Storage) === 'undefined') {
      log('no storage');
    }
    else {
      // get channel data

      var label = sessionStorage.eu_portal_channel_label;
      var name  = sessionStorage.eu_portal_channel_name;
      var url   = sessionStorage.eu_portal_channel_url;

      if(typeof url !== 'undefined' && url !== 'undefined' ){
        var crumb = $('.breadcrumbs li.js-channel');
        var link  = crumb.find('a');
        link.text(label);
        link.attr('href', url);
        crumb.removeClass('js-channel');
      }

      // menu styling

      if(name && name !== 'undefined'){
        $('#main-menu ul a').each(function(i, ob){
          var $ob  = $(ob);
          var href = $ob.attr('href');
          if(href && href.indexOf('/channels/' + name) >-1){
            $ob.addClass('is-current');
          }
        });
      }

      channelData = {
        label: label,
        name: name,
        url: url,
        dimension: 'dimension1'
      };

      if(typeof ugcEnabledCollections !== 'undefined' && ugcEnabledCollections.indexOf(name) > -1){
        require(['e7a_1418'], function(e7a1418){
          e7a1418.initPageInvisible();
        });
        $('.e7a1418-nav a').each(function(i, ob){
          var $ob = $(ob);
          var href = channelData.url + '/contribute?theme=minimal#action=' + $ob.data('action');
          $ob.attr('href', href);
        });
      }

      return channelData;
    }
  };

  function initPage(searchForm){

    searchForm.bindShowInlineSearch();

    if(channelData === null){
      channelCheck();
    }
    // set preferred search
    var preferredResultCount = (typeof(Storage) === 'undefined') ? null : localStorage.getItem('eu_portal_results_count');
    if(preferredResultCount){
      $('.search-multiterm').append('<input type="hidden" name="per_page" value="' + preferredResultCount + '" />');
    }

    // event binding

    $(window).bind('showMediaThumbs', function(e, data){
      showMediaThumbs(data);
    });

    $(window).bind('showMap', function(){
      showMap();
    });

    $(window).bind('loadHierarchy', function(e, data){
      loadHierarchy(data, function(){
        log('hierarchy load error');
      });
    });

    loadAnnotations();

    $(window).on('colour-data-available', function(e, data){
      if(data.tf){
        $('.colour-navigation-section').show();
      }
      else{
        $('.colour-navigation-section').hide();
      }
    });

    EuColourNav.initColourData();

    if(!$('.channel-media-wrap').hasClass('empty')){
      bindMediaUI();
      initTitleBar(function(){
        initMedia(0);
      });
    }

    initActionBar();
    initEntity();

    if(typeof(Storage) !== 'undefined' && sessionStorage){

      require(['eu_data_continuity', 'purl'], function(DataContinuity){

        var params = $.url(location.href).param();

        delete params['dc'];

        if(typeof params['q'] !== 'string'){
          log('no q param: ' + typeof params['q']);
          makePromoRequest();
          return;
        }

        var channelCheck = function(url){

          var cIndex = url.indexOf('/collections/');

          if(cIndex > -1){
            var cName = url.substr(cIndex + 13).split('?')[0];
            params['collection'] = cName;
            return true;
          }
          else if(url.indexOf('?collection=') > -1 || url.indexOf('&collection=') > -1){
            if(!params['collection']){
              log('collection param not present - add it now');
              params['collection'] = $.url(url).param('collection');
            }
            return true;
          }
          return false;
        };

        var s               = sessionStorage;
        var searchUrl       = location.protocol + '//' + location.hostname + (location.port.length > 0 ? ':' + location.port : '') + '/portal/' + (channelCheck(location.href) ? 'collections/' + params['collection'] : 'search.html') + '?' + $.param(params);
        var per_page        = params['per_page'] ? parseInt(params['per_page']) : 12;
        var backLinkPresent = $('.breadcrumbs .back-url').length > 0;

        channelCheck(searchUrl);

        if(backLinkPresent){

          var backUrl = $('.breadcrumbs .back-url a').attr('href');
          searchUrl   = backUrl;
          channelCheck(searchUrl);
          params = $.extend({}, params, $.url(backUrl).param());
        }

        delete params['l'];

        if(history.state && typeof history.state.currentIndex === 'number'){
          s.eu_portal_last_results_current = history.state.currentIndex;
        }

        DataContinuity.prep(function(cameFromSearch){
          if(cameFromSearch){

            var searchUrlNav = searchUrl.split('?')[0].replace('.html', '') + '.json?';

            if(!backLinkPresent){
              $('.breadcrumbs .js-return a').attr('href', searchUrl).parent('.js-return').css('display', 'inline');
            }

            $(window).on('promotionsAppended', function(){
              DataContinuity.parameteriseLinks('.channel-object-next-prev a');
            });

            if(s.eu_portal_last_results_current && s.eu_portal_last_results_total && s.eu_portal_last_results_offset && s.eu_portal_last_results_items && !isNaN(s.eu_portal_last_results_offset)){

              if(parseInt(s.eu_portal_last_results_current) < 0){
                log('correction needed A (set to ' + (per_page - 1) + ')');
                s.eu_portal_last_results_current = per_page - 1;
              }

              if(parseInt(s.eu_portal_last_results_current) >= per_page){
                log('correction needed B (set to 0)');
                s.eu_portal_last_results_current = 0;
              }
              getNextPrevItems(makePromoRequest, searchUrlNav, params);
            }
            else{
              s.removeItem('eu_portal_last_results_current');
              s.removeItem('eu_portal_last_results_total');
              s.removeItem('eu_portal_last_results_items');
              s.removeItem('eu_portal_last_results_offset');

              getNavDataBasic(searchUrlNav, params, function(){
                getNextPrevItems(makePromoRequest, searchUrlNav, params);
              });
            }
          }
          else{
            // we did not come from a search
            makePromoRequest();
          }
        });

      });
    }

    if($('.eu-accordion-tabs').length > 0){
      suggestions = $('.eu-accordion-tabs');
      require(['util_slide'], function(EuSlide){
        initSuggestions(EuSlide);
      });
    }

    $(window).europeanaResize(function(){
      $('.slide-rail').css('left', 0);
      $('.js-swipeable').css('left', 0);
    });

    scrollEvents.fireAllVisible();
  }

  return {
    initPage: function(searchForm){
      initPage(searchForm);
    },
    getPinterestData: function(){
      var desc  = [$('.object-overview .object-title').text(), $('.object-overview object-title').text()].join(' ');
      var media = $('.single-item-thumb .external-media.playable').attr('href')
        || $('.single-item-thumb .external-media img').attr('src')
        || $('.external-media:first').data('uri');
      return {
        media: media,
        desc: desc
      };
    }
  };
});
