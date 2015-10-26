define(['jquery', 'imagesLoaded'], function($, imagesLoaded) {

  // main link between search page and the various players
  var posterSelector     = '.multi-item-poster a';
  var listSelector       = '.object-media-nav';
  var singleSelector     = '.single-item-thumb';
  var listItemSelector   = listSelector + ' a';
  var singleItemSelector = singleSelector + ' a';

  var isMultiple         = $(listItemSelector).length > 1;

  var mediaViewerImage   = null;
  var pdfViewer          = null;
  var videoViewer        = null;
  var audioPlayer        = null;
  var iiifViewer         = null;

  function log(msg){
      console.log('search-media-controller: ' + msg);
  }

  function hideAllViewers() {

    log('hideAllViewers()');
    $('.media-viewer .object-media-iiif').addClass('is-hidden');
    $('.media-viewer .object-media-image').addClass('is-hidden');
    $('.media-viewer .object-media-text').addClass('is-hidden');
    $('.media-viewer .multi-item-poster').addClass('is-hidden');

    if(audioPlayer){
        log('cleanup audio');
        audioPlayer.hide();
    }
    if(iiifViewer){
        iiifViewer.hide();
        iiifViewer = null;
    }
    if(pdfViewer){
        pdfViewer.hide();
    }
    if(videoViewer){
        log('cleanup video');
        videoViewer.hide();
    }
  }

  function initMedia() {
    log( 'initMedia()' );
  }

  function removePlayability(data){
      log('remove playability...');
      data.$thumb.removeClass('playable');
      data.$thumb.find('.media-clickable-indicator').remove();

      $(listItemSelector).removeClass('loading');
      $(singleItemSelector).removeClass('loading');

      $('.media-viewer .object-media-' + data.player).addClass('is-hidden');
  }

  function mediaClosed(evt, data){
      $('.media-viewer').removeClass('active');
      $('.media-viewer .multi-item-poster').removeClass('is-hidden');
  };

  function mediaOpened(evt, data){
    if(data.hide_thumb){
      // TODOL review this
      $(listSelector).addClass('open');
      $(singleSelector).addClass('open');

      //log('hide thumb add class ' + singleSelector + ' and ' + listSelector);
    }

    $(listItemSelector).removeClass('loading');
    $(singleItemSelector).removeClass('loading');

    $('.media-viewer').addClass('active');

    // trigger resize of arrows
    if(data.type != 'image'){
        $('.media-viewer').trigger({"type": "refresh-nav-carousel"});
    }
  }


  function initMediaAudio(evt, data) {
    hideAllViewers();

    $('.media-viewer .object-media-audio').removeClass('is-hidden');

    require(['media_viewer_videojs'], function(player) {
        audioPlayer = player;

        var media = audioPlayer.getItemFromMarkup(data.target);

        if(media){
            audioPlayer.init(media);
        }
        else{
            $('.media-viewer').trigger({"type": "remove-playability", "$thumb": data.target, "player": "audio"});
            log('missing audio item - removed');
        }
    });
  }

  function initMediaIIIF(evt, data) {

    log( 'initMediaIIIF() ' + data.url);

    hideAllViewers();
    $('.media-viewer .object-media-iiif').removeClass('is-hidden');

    require(['leaflet'], function(viewer) {
      require(['media_viewer_iiif'], function(viewer) {
          iiifViewer = viewer;
          iiifViewer.init(data.url, data.target)
      });
    });
  }

  function initMediaImage(evt, data) {

    log( 'initMediaImage()   '  + mediaViewerImage );
/*
    if(mediaViewerImage){

        hideAllViewers();

        $('.media-viewer .object-media-image').removeClass('is-hidden');

        mediaViewerImage.setUrl(data.url);
        data.type = 'image';
        mediaOpened(evt, data);
        return;
    }
*/
    // collect all image data:
    var imgData = [];
    var checkData = [];
    var clickedImg = data.target.attr('data-uri');


    $(listItemSelector + '[data-type=image]')
      .add(singleItemSelector + '[data-type=image]').each(function(){

        var $el    = $(this);
        var uri    = $el.attr('data-uri');
        var height = $el.attr('data-height');
        var width  = $el.attr('data-width');

        if(uri && width && height && width.length > 0 && height.length > 0){

            log('add img: ' + uri + ', w ' + width + ', h ' + height);

            imgData.push({
                src: uri,
                h: parseInt(height),
                w: parseInt(width)
            });
        }
        else{
            log('incomplete image data')
        }
    });

    require(['media_viewer_image'], function(mediaViewerImageIn){
        mediaViewerImage = mediaViewerImageIn;
        hideAllViewers();
        $('.media-viewer .object-media-image').removeClass('is-hidden');
        if(!mediaViewerImage.init(imgData, clickedImg)){
            removePlayability({"$thumb": $(data.target)});
        }
    });
  }

  function initMediaPdf( evt, data ) {

      log( 'initMediaPdf(): ' + data.url );

      if(data.url && data.url.length > 0){
          if(pdfViewer){
              hideAllViewers();
              pdfViewer.show();
              pdfViewer.init(data.url);
          }
          else{
              require(['jquery'], function(){
                  require(['pdfjs'], function(){
                      require(['pdf_lang'], function(){
                          require(['media_viewer_pdf'], function(viewer){
                              hideAllViewers();
                              $('.media-viewer .object-media-pdf').removeClass('is-hidden');
                              pdfViewer = viewer;
                              pdfViewer.init(data.url);
                          });
                      });
                  });
              });
          }
      }
  }

  function initMediaVideo(evt, data) {
      hideAllViewers();
      $('.media-viewer .object-media-video').removeClass('is-hidden');

      require(['media_viewer_videojs'], function( viewer ) {
          videoViewer = viewer;

          var media = videoViewer.getItemFromMarkup(data.target);

          if(media){
              videoViewer.init(media);
          }
          else{
              $('.media-viewer').trigger({"type": "remove-playability", "$thumb": data.target, "player": "video"});
              log('missing video item - removed');
          }
      });
  }


  function handleListItemSelectorClick(evt) {

      if($(this).hasClass('disabled')){
          log('return because media link disabled');
          evt.preventDefault();
          return;
      }

      if($(this).hasClass('playable')){
          $(this).addClass('loading');

          var data_type = $(this).attr('data-type');

          console.log('media controller will trigger event' + "object-media-" + data_type);

          $('.media-viewer').trigger("object-media-" + data_type, {url:$(this).attr('data-uri'), thumbnail:$(this).data('thumbnail'), target:$(this)});
          evt.preventDefault();
      }
      else{
          log('media item not playable');
      }
  }

  $(posterSelector).on('click', function(e){
      var target = $(e.target).closest('a');
      var uri    = target.data('uri');
      $(listItemSelector).each(function(i, ob){
          var item = $(ob);
          if(item.data('uri')==uri){
              item.click();
          }
      });
  });

  $('.media-viewer').on('media_init', initMedia);
  $('.media-viewer').on('object-media-audio', initMediaAudio);
  $('.media-viewer').on('object-media-iiif', initMediaIIIF);
  $('.media-viewer').on('object-media-image', initMediaImage);
  $('.media-viewer').on('object-media-pdf', initMediaPdf);
  $('.media-viewer').on('object-media-video', initMediaVideo);
  $('.media-viewer').on('object-media-open', mediaOpened);
  $('.media-viewer').on('object-media-close', mediaClosed);
  $('.media-viewer').on('remove-playability', removePlayability);
  $(listSelector).on('click', 'a', handleListItemSelectorClick);
  $(singleItemSelector).on('click', handleListItemSelectorClick);

});
