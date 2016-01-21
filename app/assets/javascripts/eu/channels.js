define(['jquery', 'search_form', 'smartmenus'], function () {

    var promisedPageJS = jQuery.Deferred();

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

    // TODO: finish implementing this improved load strategy (done for settings only)

    if(typeof pageName == 'undefined' || !pageName){
        console.warn('pageName not specified - cannot bootstrap app');
        return;
    }
    console.log('pageName ' + pageName);

    switch(pageName){
        case 'browse/colours':
            promisedPageJS.resolve();
            break;

        case 'browse/new_content':
            promisedPageJS.resolve();
            break;

        case 'browse/sources':
            require(['util_foldable']);
            promisedPageJS.resolve();
            break;

        case 'collections/show':
            require(['search_results'], function(page){
                page.initPage();
                promisedPageJS.resolve(page);
            });
            break;
        case 'portal/show':
            require(['search_object'], function(page){
                page.initPage();
                promisedPageJS.resolve(page);
            });
            break;
        case 'portal/index':
            require(['search_results'], function(page){
                page.initPage();
                promisedPageJS.resolve(page);
            });
            break;
        case 'portal/static':
            require(['util_foldable']);
            promisedPageJS.resolve();
            break;
        case 'home/index':
            require(['search_home'], function(page){
                page.initPage();
                promisedPageJS.resolve(page);
            });
            break;
        case 'settings/language':
            require(['settings'], function(page){
                page.initPage();
                promisedPageJS.resolve(page);
            });
            break;
        default:
            console.warn('pageName not recognised (' + pageName + ') - cannot bootstrap app');

     }

    return {
        getPromisedPageJS: function(){
            return promisedPageJS.promise();
        }
    }
});