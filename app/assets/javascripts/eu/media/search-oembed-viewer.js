define([], function() {
  'use strict';

  function log(msg) {
    console.log('OembedViewer: ' + msg);
  }

  function init(container, play_html){

      var oembed;
      var oembedId;
      var dependencies = [];
      var scripts      = [];
      var wrapped      = $('<div>' + play_html + '</div>');
      var isNewspaper  = false;

      if(wrapped.children().length > 1){
          wrapped.children().each(function(){

              var nodeName = this.nodeName.toUpperCase();

              if(nodeName == 'DIV'){
                  oembed   = $(this);
                  oembedId = oembed.attr('id');
              }
              if(nodeName == 'IFRAME'){
                  oembed   = $(this);
                  oembedId = oembed.attr('id');
              }
              else if(nodeName == 'SCRIPT'){

                  var child = $(this);
                  var src = child.attr('src');

                  if(src && typeof src.toLowerCase() == 'string'){
                      dependencies.push(src)
                  }
                  else{
                      scripts.push(child);
                  }
              }
          });
      }
      else{
          oembed = $(play_html);
      }

      var loadDependencies = function(dependencies, callback){

          if(dependencies.length > 0){
              var dep = dependencies.pop();
              require([dep], function(){
                  loadDependencies(dependencies, callback);
              });
          }
          else{
              callback();
          }
      };

      loadDependencies(dependencies.reverse(), function(){

          if(oembed.attr('src').indexOf('theeuropeanlibrary') > -1 && oembed.attr('src').indexOf('newspapers') > -1){
              container.css('width', '100%');
              isNewspaper = true;
          }
          else if(oembed.attr('width')){
              var w = oembed.attr('width')

              if(w && w === parseInt(w) + ''){
                  container.css('width', w + 'px');
              }
              else{
                  container.css('width', w);
              }
          }

          container.append(oembed);

          $(scripts).each(function(){
              container.after(this);
          })

          container.css('max-width', '100%');
          container.css('position',  'relative');
          container.css('margin',    'auto');

          oembed.css('margin', 'auto');
          $('#' + oembedId).parent().css('margin', 'auto');
          container.find('object').css('height', '100%');

          if(isNewspaper){
            container.css('margin-bottom', '1em');
            oembed.css('margin-bottom',    '1em');

            $('.object-media-oembed iframe').on('load', function(){
                alert(JSON.stringify( $(this).contents() ))
                alert("$('.object-media-oembed iframe').contents().find('#exit-fs-link')  " + $('.object-media-oembed iframe').contents().find('#exit-fs-link').size()   )
                $('.object-media-oembed iframe').contents().find('#exit-fs-link').hide();
            });


          }

          $('.media-viewer').trigger("object-media-open", {hide_thumb: true});

      });

  }

  return {
    init: function(container, play_html) {
        init(container, play_html);
    },
  };
});
