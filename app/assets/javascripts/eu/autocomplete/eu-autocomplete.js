define(['jquery', 'util_resize'], function($){

  var css_path = require.toUrl('../../eu/autocomplete/style.css');

  $('head').append('<link rel="stylesheet" href="' + css_path + '" type="text/css"/>');

  function log(msg){
    console.log('Autocomplete: ' + msg);
  };

  var form               = null;
  var translations       = { 'Agent': 'Person', 'Place' : 'Place', 'Concept': 'Topic' };
  var typedTerm          = null;
  var urlStem            = null;

  var fnOnShow           = null;
  var fnOnHide           = null;

  var $input             = null;
  var $list              = null;
  var $anchor            = null;
  var $widthEl           = null;


  function init(ops){
    $input       = $(ops.selInput);
    $anchor      = ops.selAnchor  ? $(ops.selAnchor)  : $input;
    $widthEl     = ops.selWidthEl ? $(ops.selWidthEl) : $anchor;
    $anchor.after('<ul class="eu-autocomplete" style="top:' + $anchor.outerHeight() + 'px"></ul>');
    $list = $anchor.next('.eu-autocomplete');
    $input.attr('autocomplete', 'off');

    fnOnShow     = ops.fnOnShow;
    fnOnHide     = ops.fnOnHide;
    form         = ops.searchForm;
    translations = ops.translations;
    urlStem      = ops.url;

    bindKeyboard();
    bindMouse();

    $(window).europeanaResize(resize);
    resize();
  }

  function resize(){
    $list.width(($widthEl.outerWidth()-4) + 'px');
  }

  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  function isElementInViewport(el){
    el = el[0];
    var rect = el.getBoundingClientRect();
    return (rect.top >= 0 && rect.left >= 0 && rect.bottom) - (window.innerHeight || document.documentElement.clientHeight)
  }

  function hide(){
    $list.empty();
    if(fnOnHide){
      fnOnHide();
    }
  }

  function updateInput($el){
    if($el){
      $input.val($el.data('term'));
      var inV = isElementInViewport($el);
      if(inV > 0){
        log('update scroll')
        $(window).scrollTop($(window).scrollTop() + inV);
      }
    }
  }

  function select(){
    var sel = $list.find('.selected');
    if(sel.length){
      updateInput(sel);
      hide();
    }
  }

  function setSelected($el){
    $list.find('li').removeClass('selected');
    $el.addClass('selected');
    select();
    form.submit();
  }

  function back(first){
    if($list.find('li').length == 0){
      return;
    }
    if(first){
      $list.find('li').removeClass('selected');
      var $f = $list.find('li:first')
      $f.addClass('selected');
      updateInput($f);
    }
    else{
      var $sel = $list.find('.selected');
      if($sel.length>0){
        var $prev = $sel.prev('li');
        if($prev.length > 0){
          $sel.removeClass('selected');
          $prev.addClass('selected');
          updateInput($prev);
        }
        else{
          $list.find('.selected').removeClass('selected');
          $input.val(typeof typedTerm == null ? '' : typedTerm);
        }
      }
    }
  }

  function fwd(last){
    if($list.find('li').length == 0){
      return;
    }
    if(last){
      var $l = $list.find('li:last')
      $list.find('li').removeClass('selected');
      $l.addClass('selected');
      updateInput($l);
    }
    else{
      var $sel = $list.find('.selected');
      if($sel.length == 0){
        var $f = $list.find('li:first')
        $f.addClass('selected');
        updateInput($f);
      }
      else{
        var $next = $sel.next('li');
        if($next.length > 0){
          $sel.removeClass('selected');
          $next.addClass('selected');
          updateInput($next);
        }
        else{
          $list.find('.selected').removeClass('selected');
          $input.val(typeof typedTerm == null ? '' : typedTerm);
          $(window).scrollTop(0);
        }
      }
    }
  }

  function processItem(value, item){
    return '<span class="suggest-val">' + value + '</span><br>'
    + (item.dateOfBirth || item.dateOfDeath ?                                             '<span class="suggest-life">' : '')
    + (item.dateOfBirth ?                                                                 '<span class="suggest-dob">'  +  item.dateOfBirth + '</span><br>'  : '')
    + (item.dateOfDeath ? (item.dateOfBirth ? '' : '<span class="suggest-dox"></span>') + '<span class="suggest-dod">'  +  item.dateOfDeath + '</span><br>' : '')
    + (item.dateOfBirth || item.dateOfDeath ? '</span>' : '')
    + (item.professionOrOccupation ? '<span class="suggest-prof">' +  item.professionOrOccupation + '</span><br>' : '')
    + '<span class="suggest-type'   + (item.type ? (' suggest-' + item.type.toLowerCase() ) : '') + '">' + (translations[item.type] || item.type) + '</span>';
  }

  function processResult(data, term){
    $list.empty();
    if(fnOnHide){
      fnOnHide();
    }
    var dataList = data['contains'];
    if(!dataList){
      return;
    }
    dataList = [].concat(data['contains']);
    var valPath  = 'prefLabel';

    $.each(dataList, function(i, item){
      var value   = item[valPath];
      var escaped = escapeRegExp(term);
      var display = (escapeRegExp(value + "")).replace(new RegExp("(" + escaped + ")", "gi") , "<b>$1</b>").replace('\\(', '(').replace('\\)', ')');
      $list.append('<li data-term="' + value + '">' + processItem(display, item) + '</li>');
    });
  }

  function getSuggestions(term){
    $.getJSON(urlStem + term, function(data){
      processResult(data, term);

      if($list.find('li').length > 0){
        if(fnOnShow){
          fnOnShow();
        }
      }

    })
    .error(function(e, f){
      log('Error: ' + e + '  ' + f);
      hide();
    });
  };

  function bindKeyboard(){
    $input.on('keyup', function(e){

      if(!$list.is(":visible")){
        log('exit (hidden)');
        return;
      }

      var key = window.event ? e.keyCode : e.which;
      if(key == 40){
        // down
        fwd(e.ctrlKey || e.shiftKey);
      }
      else if(key == 38){
        // up
        back(e.ctrlKey || e.shiftKey);
      }
      else if(e.keyCode == 13){
        // carriage return
        e.stopPropagation();
        e.preventDefault();
        select();
      }
      else if(e.keyCode == 9){
        // tab
      }
      else if(key==27){
        // esc
        $list.empty();
        $input.val(typeof typedTerm == null ? '' : typedTerm);
      }
      else{
        var val = $(this).val();
        typedTerm = val;
        getSuggestions(val);
      }
    });
  }

  function bindMouse(){
    $(document).on('click', '.eu-autocomplete li', function(e){
      setSelected($(this));
    });
  }

  return {
    init: function(ops){
      init(ops);
    }
  }

});