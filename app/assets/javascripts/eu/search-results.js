define(['jquery', 'ga'], function ($, ga){

    var results = $('.result-items');

    function log(msg){
      console.log(msg);
    }

    var handleEllipsis = function(){

    var texts = results.find('h1:not(.js-ellipsis)');
    var toFix = [];

    texts.css('overflow-y', 'auto');
    texts.each(function(){
      if($(this).find('a')[0].offsetHeight > $(this).height()){
        $(this).addClass('js-ellipsis');
        toFix.push($(this));
      }
    });
    texts.css('overflow-y', 'hidden');

    if(toFix.length>0){
      require(['util_ellipsis'], function(EllipsisUtil){
        EllipsisUtil.create($(toFix));
      });
    }

    var noImageTexts = results.find('.search-list-item.missing-image .item-image:not(.js-ellipsis)');

    if(noImageTexts.size()>0){
      require(['util_ellipsis'], function(EllipsisUtil){
        EllipsisUtil.create(noImageTexts, { 'fixed': '<span class="fixed"></span>'});
          $('.search-list-item.missing-image .fixed').each(function(){
            var icon = $(this).closest('.item-preview').next('.item-info').find('.icon');
            if(icon){
              $(this).parent().after($(this));
              $(this).html(icon);
              $(this).css('position', 'static');
            }
            else{
              $(this).remove();
            }
          });
        });
      }
    };

    var bindViewButtons = function(){
      var btnGrid = $('.icon-view-grid').closest('a');
      var btnList = $('.icon-view-list').closest('a');

      var loadView = function(){
        return (typeof(Storage) == 'undefined') ? 'list' : localStorage.getItem('eu_portal_results_view');
      };

      var saveView = function(view){
        if(typeof(Storage) != 'undefined') {
          localStorage.setItem('eu_portal_results_view', view);
        }
      };

      var showGrid = function(save){
        results.addClass('grid');
        btnGrid.addClass('is-active');
        btnList.removeClass('is-active');
        if(save){
          saveView('grid');
        }
        handleEllipsis();
      };

      var showList = function(save){
        results.removeClass('grid');
        btnList.addClass('is-active');
        btnGrid.removeClass('is-active');
        if(save){
          saveView('list');
        }
      };

      btnGrid.on('click', function(e){
        e.preventDefault();
        showGrid(true);
      });

      btnList.on('click', function(e){
        e.preventDefault();
        showList(true);
      });

      if(loadView()=="grid"){
        showGrid();
      }
      else{
        showList();
      }
    }

    var bindGA = function(){
      $('.item-origin .external').on('click', function(){
        var href =  $(this).attr('href');
        ga('send', {
          hitType: 'event',
          eventCategory: 'Redirect',
          eventAction: href,
          eventLabel: 'CTR List'
        });
        log('GA: Redirect, Action = ' + href);
      });
    }

    var initPage = function(){
      bindViewButtons();
      bindGA();

      if(typeof(Storage) !== "undefined") {
         var label = $('.breadcrumbs').data('store-channel-label');
         var name  = $('.breadcrumbs').data('store-channel-name');
         var url   = $('.breadcrumbs').data('store-channel-url');

         sessionStorage.eu_portal_channel_label = label;
         sessionStorage.eu_portal_channel_name  = name;
         sessionStorage.eu_portal_channel_url   = url;
      }
    };

    return {
      initPage: function(){
        initPage();
      }
    }
});