define(['jquery', 'util_resize'], function($){

  var css_path  = require.toUrl('../../eu/accordion_tabs/style.css');
  var tabsClass = 'as-tabs';

  function log(msg){
    console.log(msg);
  }

  function applyMode($cmp){
    $cmp.addClass(tabsClass);
    if($cmp.find('.tab-header:first')[0].offsetTop != $cmp.find('.tab-header:last')[0].offsetTop){
      $cmp.removeClass(tabsClass);
    }
  }

  function activate($cmp, index){
    $cmp.find('.tab-content:eq(' + index + ')').add($cmp.find('.tab-header:eq(' + index + ')')).addClass('active');
  }

  function deactivate($cmp){
    $cmp.find('.tab-content.active').add($cmp.find('.tab-header.active')).removeClass('active');
  }

  function loadTabs($cmp, template, callback){

    var getTabContent = function(Mustache, tab, index){

      var url = $(tab).data('content-url');

      $(tab).addClass('loading');

      $.getJSON(url).done(function(data) {

        $(tab).find('.tab-subtitle').html(data.tab_subtitle);

        $.each(data.search_results, function(i, item){
          var rendered = Mustache.render(template, item);
          $(tab).next('.tab-content').append(rendered);
        });
        callback(data, index);
      })
      .fail(function(msg){
        log('failed to load data (' + JSON.stringify(msg) + ') from url: ' + url);
      })
      .always(function(){
        $(tab).removeClass('loading');
      });
    };

    require(['mustache'], function(Mustache){
      Mustache.tags = ['[[', ']]'];
      $.each($cmp.find('.tab-header'), function(i, tabHeader){
        getTabContent(Mustache, tabHeader, i);
      });
    });
  }

  function init($cmp, ops){

    var active    = ops.active ? ops.active : 0;
    var fnOpenTab = ops.fnOpenTab;

    applyMode($cmp);

    $(window).europeanaResize(function(){
      applyMode($cmp);
    });

    $('.tab-header:eq(' + ($('.tab-header').length-1)  + ')').addClass('js-last');

    if(active > -1){
      activate($cmp, active);
      if(fnOpenTab){
        fnOpenTab(active);
      }
    }
    else{
      $('.tab-content:eq(0)').add('.tab-header:eq(0)').addClass('active');
    }

    function headerClick(){
      if($cmp.hasClass(tabsClass)){
        $cmp.find('.tab-content').add($cmp.find('.tab-header')).removeClass('active');
        $(this).addClass('active');
        $(this).next('.tab-content').addClass('active');
      }
      else{
        $(this).toggleClass('active');
        var active = $(this).hasClass('active');
        $cmp.find('.tab-content').add($cmp.find('.tab-header')).removeClass('active');
        if(active){
          $(this).addClass('active');
          $(this).next('.tab-content').addClass('active');
        }
      }
      if(fnOpenTab){
        $.each($cmp.find('.tab-content'), function(i, ob){
          if($(ob).hasClass('active')){
            fnOpenTab(i);
          }
        });
      }
    }
    $cmp.find('.tab-header').on('click', headerClick);
  }

  function loadStyle(cb){
    $('<link rel="stylesheet" href="' + css_path + '" type="text/css"/>').on('load', cb).appendTo('head');
  }

  return {
    init: function($cmp, ops){
      loadStyle(function(){
        init($cmp, ops);
      });
    },
    activate: activate,
    deactivate: deactivate,
    loadTabs: loadTabs
  };
});