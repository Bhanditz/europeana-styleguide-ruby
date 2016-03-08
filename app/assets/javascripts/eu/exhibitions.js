define(['jquery'], function ($) {

  //var $url             = $.url();
  var minViewportWidth = 768;
  var smIsDestroyed    = false;
  var smCtrl;

  function log(msg){
    console.log('Exhibitions: ' + msg);
  }

  function initExhibitions(){
    log('init');

    //if($url.param('sfx')){
      initSFX();
    //}

    handleEllipsis();
    initFoyerCards();
  };

  function handleEllipsis(){
      var ellipsisObjects = [];
      var texts = $('.ve-foyer-card-state .text-box.description:not(.js-ellipsis)');
      var toFix = [];

      texts.each(function(){
          $(this).addClass('js-ellipsis');
          toFix.push($(this));
      });

      if(toFix.length>0){
        require(['util_ellipsis'], function(EllipsisUtil){
          var ellipsis = EllipsisUtil.create($(toFix));
          for(var i = 0; i < ellipsis.length; i++){
              ellipsisObjects.push(ellipsis[i]);
          }
        });
      }
  };

  function initFoyerCards(){
      function Card($el){
          var self        = this;
          self.stateIndex = 0;
          self.cardStates = $el.find('.ve-foyer-card-state');
          self.$el        = $el;

          $el.find('.ve-card-nav-left').on('click', function(){
              self.left();
          });
          $el.find('.ve-card-nav-right').on('click', function(){
              self.right();
          });
          this.prepNextShift();
      };
      Card.prototype.updateButton = function(index){
          this.$el.find('.ve-state-button-on').removeClass('ve-state-button-on').addClass('ve-state-button-off')
          this.$el.find('.ve-state-'  + index).removeClass('ve-state-button-off').addClass('ve-state-button-on')
      }
      Card.prototype.prepNextShift = function(shift){
          var next = this.stateIndex == this.states.length -1 ? 0 : this.stateIndex + 1;
          var prev = this.stateIndex == 0 ? this.states.length -1 : this.stateIndex - 1;

          next = $(this.cardStates.get(next));
          prev = $(this.cardStates.get(prev));

          if(next.hasClass('hide-left')){
            next.removeClass('animating');
            next.removeClass('hide-left');
            next.addClass('hide-right');
          }
          if(prev.hasClass('hide-right')){
            prev.removeClass('animating');
            prev.removeClass('hide-right');
            prev.addClass('hide-left');
          }
      }
      Card.prototype.shiftState = function(shift){

          // hide the current
          var text = $(this.cardStates.get(this.stateIndex));

          text.addClass('animating');
          text.addClass(shift > 0 ? 'hide-left' : 'hide-right');

          // show the next

          var newStateIndex = this.stateIndex + shift;
          if(newStateIndex == this.states.length){
              newStateIndex = 0;
          }
          else if(newStateIndex < 0){
              newStateIndex = this.states.length -1;
          }
          this.stateIndex = newStateIndex;
          var next   = $(this.cardStates.get(this.stateIndex));

          next.removeClass('animating');
          if(shift > 0){
              next.addClass('hide-right')
              next.removeClass('hide-left')
              next.addClass('animating')
              next.removeClass('hide-right')
          }
          else{
              next.addClass('hide-left')
              next.removeClass('hide-right')
              next.addClass('animating')
              next.removeClass('hide-left')
          }
          this.prepNextShift();
          this.updateButton(this.stateIndex);
      }

      Card.prototype.left = function(){
          this.shiftState(-1);
      }

      Card.prototype.right = function(){
          this.shiftState(1);
      }

      Card.prototype.states = ['title', 'description', 'credits'];

      $('.ve-foyer-card').each(function(){
          new Card($(this));
      });
  }

  function initSFX(){

      log('TODO: background-attachment:fixed on intro images');

      if ($(window).width() > minViewportWidth) {

          require(['ScrollMagic', 'TweenMax', 'util_resize'], function(ScrollMagic){
              require(['gsap'], function(){

                smCtrl = new ScrollMagic.Controller();

                $(window).europeanaResize(function(){
                    if ($(window).width() <= minViewportWidth && !smIsDestroyed) {
                        smCtrl.destroy(true)
                        smCtrl = null;
                        smIsDestroyed = true;
                        log('removed scroll-magic');
                    }
                });

                //$('.logo').css('backface-visibility', 'hidden')
                //TweenMax.to('.logo', 1.5,  { rotationX: "-=360_cw"} );

                function setNavPosition(index) {

                    $('.ve-progress-nav .ve-state-button-on')
                       .removeClass('ve-state-button-on')
                       .addClass('ve-state-button-off');

                    var active = $('.ve-progress-nav .ve-state-button').get(index)

                    $(active).addClass('ve-state-button-on').removeClass('ve-state-button-off');
                }

                $('.ve-slide-container section').each(function(i, ob) {
                    new ScrollMagic.Scene({
                        triggerElement: this,

                        triggerHook: 'onCenter',
                        offset: $(this).height()/2,
                    })
                    //.on('enter leave', function(){
                    .on('progress', function(){
                        setNavPosition(i);
                    })
                    .addTo(smCtrl);
                });

                new ScrollMagic.Scene({
                    triggerElement: '#ve-end',
                    triggerHook: 'onEnter'
                })
                .addTo(smCtrl)
                .setTween(TweenMax.to('.ve-progress-nav', 1, {'right': '-1em', ease: Cubic.easeOut}));

                // SEE EXAMPLE 4 FOR SCROLL-CONTROLLED ANIMATION:
                //   https://ihatetomatoes.net/svg-scrolling-animation-triggered-scrollmagic/
              });
          });
        }
        else {
          log('too small for scroll-magic');
        }
  }

  return {
    initPage: function(){
      initExhibitions();
    }
  }

});