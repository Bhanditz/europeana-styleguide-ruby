define(['smartmenus'], function () {

    require(['smartmenus_keyboard'], function(){

        $('.nav_primary>ul').smartmenus({
            mainMenuSubOffsetX: -1,
            mainMenuSubOffsetY: 4,
            subMenusSubOffsetX: 6,
            subMenusSubOffsetY: -6,
            subMenusMaxWidth: null,
            subMenusMinWidth: null
        });
        $('#settings-menu').smartmenus({
            mainMenuSubOffsetX: -62,
            mainMenuSubOffsetY: 4,
            subMenusSubOffsetX: 0,
            subMenusSubOffsetY: -6,
            subMenusMaxWidth: null,
            subMenusMinWidth: null
        });
        $('.js-hack-smartmenu a').click(function(){
            var href = $(this).attr('href');
            if(href != '#'){
                window.location = $(this).attr('href');
            }
        });

        $('.nav_primary>ul').smartmenus('keyboardSetHotkey', '123', 'shiftKey');
        $('#settings-menu').smartmenus('keyboardSetHotkey', '123', 'shiftKey');

    });

});


// DOM based routing

Site_HIM = {
  common : {
    init     : function(){

    },
    finalize : function(){

    }
  },
  page_entry_list : {
    init : function(){

    }
  },
  page_user_profile : {
    init : function(){

    }
  }
}



UTIL = {

  fire : function(func,funcname, args){

    var namespace = Site_HIM;  // indicate your obj literal namespace here

    funcname = (funcname === undefined) ? 'init' : funcname;
    if (func !== '' && namespace[func] && typeof namespace[func][funcname] == 'function'){
      namespace[func][funcname](args);
    }

  },

  loadEvents : function(){

    // hit up common first.
    UTIL.fire('common');

    // do all the classes too.
    $.each(document.body.className.split(/\s+/),function(i,classnm){
      UTIL.fire(classnm);
    });

    UTIL.fire('common','finalize');

  }

};

// kick it all off here
UTIL.loadEvents();