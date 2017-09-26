define(['jquery', 'util_resize'], function ($){

  var form = $('.search-multiterm');

  function log(msg){
    console.log('SearchForm: ' + msg);
  }

  function bindShowInlineSearch(){
    $('.item-nav-show').on('click', function(e){
      e.preventDefault();
      var btn = $(e.target)[0].nodeName.toUpperCase() == 'BUTTON' ? $(e.target) : $(e.target).closest('button');
      btn.hide();
      btn.prev('.content').show();
      btn.prev('.content').find('form .item-search-input').focus();
      $('.after-header-with-search').addClass('search-open');
    });
  }

  function sizeInput(){
    var input = form.find('.js-search-input');

    if(input.length == 0){
      return;
    }

    input.width('auto');

    var hitAreaWidth = parseInt($('.js-hitarea').width());
    hitAreaWidth -= 30;
    var rowRemainder = hitAreaWidth;

    $('.search-tags .search-tag').each(function(i, ob){
      var tagWidth = parseInt($(ob).outerWidth(true)) + 2;
      if(rowRemainder > tagWidth){
        rowRemainder -= tagWidth;
      }
      else{
        rowRemainder = hitAreaWidth - tagWidth;
      }
    });

    if(rowRemainder < 218){ // width of Portugese placeholder
      rowRemainder = hitAreaWidth;
    }
    input.width(rowRemainder + 'px');
  }


  function initSearchForm(){
    var input = form.find('.js-search-input');
    form.on('click', '.js-hitarea', function() {
      input.focus();
    });

    form.on('submit', function() {
      if(input.attr('name')=='qf[]' && input.val().length==0){
        return false;
      }
    });

    input.focus();
  }

  function addAutocomplete(confData){

    var processor = confData.extended_info ? 'eu_autocomplete_processor' : 'eu_autocomplete_processor_def';

    require([processor], function(AutocompleteProcessor){
      require(['eu_autocomplete', 'util_resize'], function(Autocomplete){

        var languages        = (typeof i18nLocale == 'string' && typeof i18nDefaultLocale == 'string') ? [i18nLocale, i18nDefaultLocale, ''] : typeof i18nLocale == 'string' ? [i18nLocale] :['en', ''];
        var narrowMode       = ['collections/show', 'portal/show', 'entities/show'].indexOf(pageName) > -1 && $('.item-search-input').length > 0;
        var selInput         = narrowMode ? '.item-search-input' : '.search-input';
        var inputName        = $(selInput).attr('name');
        var itemTemplateText = $('#js-template-autocomplete').text();

        var setQeParam       = function(val){
          // $(selInput).attr('name', val ? 'qe[' + val + ']' : form.find('.search-tag').length > 0 ? 'qf[]' : 'q');
          if(val){
            $(selInput).addClass('mode-entity');
          }
          else{
            $(selInput).removeClass('mode-entity');
          }
        };

        if(narrowMode){
          $('.object-nav').addClass('with-autocomplete');
        }

        Autocomplete.init({
          evtResize: 'europeanaResize',
          fnGetTopOffset: function(el){
            if(el[0]==$(selInput)[0]){
              return $('.header-wrapper').height() + 16;
            }
            return $('.header-wrapper').height();
          },
          fnOnDeselect: function(){
            setQeParam();
          },
          fnOnHide: function(){
            $('.attribution-content').show();
            $('.attribution-toggle').hide();
            $('.search-input').attr('name', inputName);
            setQeParam();
          },
          fnOnItemClick: function(el){
            if(el.length == 1){
              setQeParam(el.data('id'));
            }
          },
          fnOnShow: function(){
            $('.attribution-content').hide();
            $('.attribution-toggle').show();
          },
          fnOnUpdate: function(){
            var sel = $('.eu-autocomplete li.selected');
            if(sel.length == 1){
              setQeParam(sel.data('id'));
            }
          },
          fnPreProcess      : AutocompleteProcessor.process,
          form              : form,
          itemTemplateText  : itemTemplateText,
          languages         : languages,
          minTermLength     : confData.min_chars ? confData.min_chars : 3,
          paramName         : 'text',
          paramAdditional   : '&language=' + languages.join(',').replace(/,$/, ''),
          scrollPolicyFixed : narrowMode,
          selAnchor         : narrowMode ? null : '.search-multiterm',
          selInput          : selInput,
          selWidthEl        : narrowMode ? null : '.js-hitarea',
          theme             : 'style-entities',
          url               : confData.url ? confData.url.replace(/^https?:/, location.protocol) : 'entities/suggest.json'
        });
      });
    });
  }

  $(window).bind('addAutocomplete', function(e, data){
    addAutocomplete(data);
  });

  initSearchForm();

  /**
   * Added in response to #1137
   * This can be replaced with (restored to) a single call:
   *   sizeInput();
   * if / when we stop loading stylesheets asynchronously
   * */
  if($('.js-search-input').length > 0){
    var cssnum = document.styleSheets.length;
    var ti = setInterval(function() {
      if (document.styleSheets.length > cssnum) {
        for(var i=0; i<document.styleSheets.length; i++){
          if(document.styleSheets[i].href && document.styleSheets[i].href.indexOf('screen.css')>-1){
            clearInterval(ti);
            // additional timeout to allow rendering
            setTimeout(function(){
              sizeInput();
            }, 100);
          }
        }
      }
    }, 100);
  }

  $(window).europeanaResize(function(){
    sizeInput();
  });

  return {
    submit : function(){
      form.submit();
    },
    bindShowInlineSearch : function(){
      bindShowInlineSearch();
    }
  };

});