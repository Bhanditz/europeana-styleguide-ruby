define(['jquery', 'util_resize'], function($){

  var formSel = '.eu-ugc-form';
  var formSave = null;

  function addValidationError($el, msg){

    var defMsg      = 'Error';
    var msgOverride = $el.data('error-msg-key') || $el.closest('.input').data('error-msg-key');

    if(msgOverride){
      msg = window.I18n.translate(msgOverride);
    }

    if(!msg){
      if($el.attr('type') == 'date'){
        msg = window.I18n ? window.I18n.translate('global.forms.validation-errors.date-past') : defMsg;
      }
      else if($el.attr('type') == 'email'){
        msg = window.I18n ? window.I18n.translate('global.forms.validation-errors.email') : defMsg;
      }
      else if($el.attr('type') == 'checkbox'){
        msg = window.I18n ? window.I18n.translate('global.forms.validation-errors.confirmation-required') : defMsg;
      }
      else if($el.attr('required') == 'required'){
        msg = window.I18n ? window.I18n.translate('global.forms.validation-errors.blank') : defMsg;
      }
    }

    removeValidationError($el);

    if(msg){
      $el = $el.closest('.label-and-input');
      if($el.next('.hint').length > 0){
        $el = $el.next('.hint');
      }
      $el.after('<span class="error">' + msg + '</span>');
    }
  }

  function removeValidationError($el){

    $el.removeClass('invalid');

    $el = $el.closest('.label-and-input');

    if($el.next('.hint').length > 0){
      $el = $el.next('.hint');
    }
    $el.next('.error').remove();
    $('.error.global').addClass('hidden');
  }

  function onBlur($el){

    if(typeof window.enableFormValidation == 'undefined' || !window.enableFormValidation){
      return;
    }

    setTimeout(function(){

      $el.addClass('had-focus');

      var isSubmit = $(':focus').length > 0 && $(':focus').attr('type') && $(':focus').attr('type').toUpperCase() == 'SUBMIT';
      if(isSubmit){
        return;
      }
      if($el.is(':valid')){
        removeValidationError($el);
      }
      else{
        var isFallback = $el.hasClass('date') && $el.attr('type') != 'date';
        addValidationError($el, isFallback ? window.I18n.translate('global.forms.validation-errors.date-format') : null);
      }
    }, 1);
  }

  function initClientSideValidation(){
    $(document).on('blur', 'input:not([type="file"][accept]),textarea,select', function(){
      onBlur($(this));
    });
  }

  function bindDynamicFieldset(){

    var reindex = function(){
      $('.nested_fields:visible .sequenced_object').each(function(i){
        $(this).attr('index', i + 2);
      });
    };

    $(document).on('fields_added.nested_form_fields', function(){
      reindex();
      if(formSave){
        formSave.trackHidden();
      }
      initAutoCompletes();
      initCopyFields();
      initHiddenFields();
      initSwipeableLicense();
    });

    $(document).on('fields_removed.nested_form_fields', function(e, param){

      if(formSave){
        var selOb = '[name="' + param['delete_association_field_name'] + '"]';
        var ob    = $(selOb);
        formSave.clearFieldset($(ob).next('.nested_fields'));
      }

      reindex();
    });

    reindex();
  }


  // return 1, -1 or 0 (true, false, NA)
  function evaluateHiddenFieldOverride(f){

    var cf = f.data('requires-override');

    if(cf){
      var $cf = $('#' + cf);

      if($cf.length > 0){
        if($cf.attr('type').toUpperCase()=='CHECKBOX'){
          return $cf.is(':checked') ? 1 : -1;
        }
        else if($cf.attr('type').toUpperCase()=='RADIO'){
          return $('[name="' + $cf.attr('name') + '"]:checked').val();
        }
        return $cf.val() ? 1 : -1;
      }
    }
    return 0;
  }

  function evaluateHiddenFields(f){

    var fs = $('[data-requires="' + f.attr('id') + '"]');

    if(f.val() && f.val().length > 0){
      fs.each(function(){
        var $this = $(this);

        var ovverride = evaluateHiddenFieldOverride($this);

        if(ovverride == 1){
          $this.removeClass('enabled');
          $this.find(':input').prop('disabled', true);
        }
        else{
          $this.addClass('enabled');
          $this.find(':input').prop('disabled', false);
        }
      });
    }
    else{
      fs.removeClass('enabled');
      fs.find(':input').prop('disabled', true);
    }
  }

  function initHiddenFields(){
    $(':input').each(function(){
      evaluateHiddenFields($(this));
    });
  }

  function makeRequired($el, validateLater){
    var makesRequired = $el.data('makes-required');
    if(makesRequired){
      makesRequired = $('.' + makesRequired).find(':input');
      makeFieldOptional(makesRequired.first(), $el.val().length == 0, validateLater);
    }
  }

  function makeFieldOptional($f, tf, validateLater){
    if(tf){
      $f.removeAttr('required');
    }
    else{
      $f.attr('required', 'required');
    }
    if(!validateLater){
      onBlur($f);
    }
  }

  function bindHiddenFields(){

    $(document).on('change', ':input', function(){
      evaluateHiddenFields($(this));
    });

    $(document).on('click', ':input[type="radio"]', function(){
      onBlur($(this));
    });

    $(document).on('click', ':input[type="checkbox"]', function(){

      var $this         = $(this);
      var makesOptional = $this.data('makes-optional');

      $('[data-requires-override="' + $this.attr('id') + '"]').each(function(i, ob){

        if($(ob).is(':visible')){
          var required  = $(ob).data('requires');
          var $required = $('#' + required);

          if(required && required.length > 0 && $required.length > 0){
            evaluateHiddenFields($required);
          }
          else{
            console.log('misconfigured require override: expected element with id:\n\t' + required
            + '\n\t('
            +   'referenced by element with id: ' + $(ob).attr('id') + ' and class ' + $(ob).attr('class')
            + ')');
          }
        }
      });

      if(makesOptional){
        makeFieldOptional($('#' + makesOptional), $this.is(':checked'));
      }
      onBlur($this);
    });

    $(document).on('change', ':input[type="file"]', function(){

      var $this         = $(this);
      var clearsFields  = $this.data('clears-when-cleared');

      if($this.data('makes-required')){
        makeRequired($this);
      }

      if(clearsFields && $this.val().length == 0){
        clearsFields = $('.' + clearsFields).find(':input');
        clearsFields.prop('checked', false);
      }
    });

  }

  function evaluateCopyFields(f){

    var fc = $('[data-copies="' + f.attr('id') + '"]');

    if(f.val().length > 0){
      fc.prev('.btn-copy').addClass('enabled');
    }
    else{
      fc.prev('.btn-copy').removeClass('enabled');
    }
  }

  function initCopyFields(){

    var copyFields = $('[data-copies]:not(.copies-initialised)');

    copyFields.each(function(){

      $(this).addClass('copies-initialised');
      $(this).closest('.input').addClass('copies-other-field');
      $(this).before('<a class="btn-copy">' + (window.I18n ? window.I18n.translate($(this).data('copies-label-key')) : 'Use Name') + '</a>');
    });

    $(':input').each(function(){
      evaluateCopyFields($(this));
    });
  }

  function bindCopyFields(){

    $(document).on('keyup', ':input', function(){
      evaluateCopyFields($(this));
    });

    $(document).on('click', '.btn-copy', function(){
      var copyTo   = $(this).next('[data-copies]');
      var copyFrom = $('#' + copyTo.data('copies'));
      copyTo.val(copyFrom.val());
      copyTo.blur();
      copyTo.trigger('change');
      evaluateCopyFields(copyTo);
    });
  }


  function getAutocompleteConfig($el){

    $(document).on('keyup paste', '.autocomplete', function(e){
      if(e.type == 'keyup'){
        if([9, 16, 17, 18, 20, 34, 34, 35, 36, 42, 91, 37, 39, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123].indexOf(e.keyCode) > -1){
          return;
        }
      }
      var $this = $(this);
      $('#' + $this.data('for')).val($this.val());
    });

    return {
      fnOnSelect : function($el, $input){
        $input.change();
        $('#' + $input.data('for')).val($el.data('value'));
      },
      fnOnEnter : function(selectionMade){
        if(selectionMade){
          $('form[data-local-storage-id]').submit();
        }
      },
      fnPreProcess     : function(term, data, ops){
        var escapeRegExp = function(str){
          return str.replace(/[\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        };
        var re = new RegExp('\\b' + escapeRegExp(term), 'i');
        for(var i=0; i<data.length; i++){
          var val        = data[i].text;
          var match      = val.match(re);
          var matchIndex = val.indexOf(match);

          if(val.toLowerCase() == term.toLowerCase()){
            $('#' + ops.selInput.data('for')).val(data[i].value);
          }

          if(matchIndex > -1){
            data[i].textPreMatch  = val.substr(0, matchIndex);
            data[i].textPostMatch = val.substr(matchIndex + (match+'').length);
            data[i].textMatch     = match;
          }
          else{
            data[i].textPreMatch  = val;
          }
        }

        return data;
      },
      itemTemplateText : '<li data-term="[[text]]" data-value="[[value]]" data-hidden-id="' + name + '"><span>[[textPreMatch]]<span class="match"><b>[[textMatch]]</b></span>[[textPostMatch]]</span></li>',
      minTermLength    : 2,
      paramName        : $el.data('param'),
      selInput         : $el,
      threshold        : 150,
      url              : $el.data('url'),
      hideOnSelect     : true,
      disableArrowsLR  : true
    };
  }

  function initAutoComplete($el){

    $el.wrap('<div class="relative">');
    $el.addClass('autocomplete-initialised');

    require(['eu_autocomplete', 'util_resize'], function(Autocomplete){

      if(['migration/edit', 'migration/update'].indexOf(window.pageName) > -1){

        var $hidden  = $('#' + $el.data('for'));
        var derefUrl = $el.data('deref-url');

        if($el.val().length == 0 && $hidden.val().length > 0 && derefUrl){

          var hVal = $hidden.val();

          if(hVal.match(new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi))){
            $.getJSON(derefUrl + '?uri=' + hVal).done(function(data){
              $el.val(data.text);
            });
          }
          else{
            $el.val(hVal);
          }
          Autocomplete.init(getAutocompleteConfig($el));
        }
        else{
          Autocomplete.init(getAutocompleteConfig($el));
        }
      }
      else{
        Autocomplete.init(getAutocompleteConfig($el));
      }

    });
  }

  function initAutoCompletes(){

    var autocompletes = $('[data-url]:not(.autocomplete-initialised)');

    if(autocompletes.length > 0){
      autocompletes.each(function(){
        initAutoComplete($(this));
      });
    }
  }

  function initFormSave(){
    require(['eu_form_save'], function(FormSave){
      var $form = $('form[data-local-storage-id]');
      formSave  = FormSave.create($form, window.pageName == 'migration/create');
    });
  }

  function initSwipeableLicense(){

    var licenseData = [
      {
        'name': window.I18n.translate('global.facet.rights.cc0'),
        'classes': ['icon-license-zero']
      },
      {
        'name': window.I18n.translate('global.facet.rights.cc-by-sa'),
        'classes': ['icon-license-cc', 'icon-license-by', 'icon-license-sa']
      },
      {
        'name': window.I18n.translate('global.facet.rights.rs-cne'),
        'classes': ['icon-license-unknown']
      }
    ];

    require(['util_slide', 'util_resize'], function(EuSlide){

      var checkedRadio = $('.license-radio-option input:checked');
      checkedRadio.click();

      $('.label-and-input > .license-radio-option').wrapAll('<div class="licenses">');

      var $el = $('.licenses:not(.js-swipe-bound)');

      if($el.length > 0){

        // bind radio tick / add license classes

        $el.wrap('<div class="slide-rail">');
        EuSlide.makeSwipeable($el);
        $el.find('input').after('<span class="checkmark"></span>');

        $el.find('label').each(function(i, ob){

          var data      = licenseData[i];
          var icons     = $('<span class="cc-info-row"></span>');
          var container = $('<span class="cc-info">').appendTo($(ob));

          $(data.classes).each(function(){
            icons.append('<span class="license-icon ' + this + '">');
          });
          icons.append('<span class="cc-name">' + data.name + '</span>');
          container.append(icons);
        });

      }
    });
  }

  function validateForm(){

    if(typeof window.enableFormValidation != 'undefined' && window.enableFormValidation){

      var invalids = $('input:invalid').add('textarea:invalid').add('select:invalid');
      invalids     = $.map(invalids, function(i){
        var $i = $(i);
        if(!$i.is(':hidden')){
          return $i;
        }
      });

      var valid = invalids.length == 0;

      $.each(invalids, function(){
        var $this = $(this);
        $this.addClass('invalid');
        addValidationError($this);
      });

      return valid;
    }
    else{
      return true;
    }
  }

  function initDateFields(){
    var maxDate = new Date().toISOString().substring(0,10);
    $('input[type=date]:not([max])').attr('max', maxDate);
    console.log('set max date of ' + maxDate + ' on ' + $('input[type=date]').length + ' fields');
  }

  function initFileFields(){

    var reFileStem = /([^/]*)$/;

    $(document).on('change', '[type="file"][accept]', function(){

      if(typeof window.enableFormValidation == 'undefined' || !window.enableFormValidation){
        console.log('all front-end validation disabled');
        return;
      }
      removeValidationError($(this));

      if(!(window.FileReader && window.Blob)) {
        return;
      }

      var input        = $(this);
      var val          = input.val();
      var allowedTypes = input.attr('accept').split(',');
      var files        = input[0].files;
      var maxBytes     = input.data('max-bytes');

      if(val && val.length > 0){

        var ext           = val.slice(val.lastIndexOf('.'));
        var isAllowedSize = maxBytes ? parseInt(maxBytes) >= files[0].size : true;
        var isAllowedType = false;

        $.each(allowedTypes, function(){

          var isMime    = this.indexOf('/') > -1;
          var allowRule = this.trim().toUpperCase();

          if(isMime){

            var mimeType = files[0].type.toUpperCase();

            if(mimeType == allowRule){
              isAllowedType = true;
              return false;
            }
            else if(allowRule.indexOf('*') > -1){

              if(allowRule.replace(reFileStem, '') == mimeType.replace(reFileStem, '')){
                isAllowedType = true;
                return false;
              }
            }
          }
          else if(ext && ext.length > 0){
            if(ext.toUpperCase() == this.trim().toUpperCase()){
              isAllowedType = true;
              return false;
            }
          }
        });

        if(!isAllowedType){
          var msg1 = window.I18n ? window.I18n.translate('global.forms.validation-errors.file-type', {allowed_types: allowedTypes.join(', ')}) : 'Invalid file type';
          addValidationError($(this), msg1);
        }
        else if(!isAllowedSize){
          var msg2 = window.I18n ? window.I18n.translate('global.forms.validation-errors.file-size', {limit_mb: maxBytes / (1024 * 1024) }) : 'Invalid file size';
          addValidationError($(this), msg2);
        }
        else{
          removeValidationError($(this));
        }
      }

    });
  }

  function initPage(){

    var $form = $(formSel);
    var key   = $form.attr('recaptcha-site-key');

    var onSubmit = function(){

      if(validateForm()){

        if(typeof window.grecaptcha != 'undefined'){

          var captchaResponse = window.grecaptcha.getResponse();

          if(!captchaResponse || captchaResponse == '' || captchaResponse == 'false'){
            window.grecaptcha.execute();
            return false;
          }
          else{
            console.log('proceed with submission...');
            if(formSave){
              formSave.save();
            }
            $form.off('submit');
            $form.submit();
          }
        }
        else{
          if(formSave){
            formSave.save();
          }
          $form.off('submit');
          $form.submit();
        }
      }
      else{
        $('.error.global').removeClass('hidden');
        return false;
      }
    };

    $form.on('submit', onSubmit);

    window.onloadCallback = function(){

      window.grecaptcha.render('g-recaptcha', {
        'sitekey': key,
        'callback': onSubmit,
        'size': 'invisible'
      });
      window.grecaptcha.reset();
    };

    if(key && location.href.indexOf('no-verify') == -1){
      $form.append('<div id="g-recaptcha"></div>');
      $('body').append('<script src="https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit" async defer></script>');
    }

    $(document).on('external_js_loaded', function(){

      $('.ugc-content').addClass('external-js-loaded');

      $(document).on('eu-form-save-initialised', function(){
        initHiddenFields();
        initCopyFields();
      });

      if(typeof window.enableFormSave != 'undefined' && window.enableFormSave){
        initFormSave();
      }
      else{
        initHiddenFields();
        initCopyFields();
      }

      $('[data-makes-required]').each(function(){
        var $this = $(this);
        var type  = $this.attr('type');
        var val   = false;

        if(type.toUpperCase()=='CHECKBOX'){
          val = $this.is(':checked');
        }
        else if(type.toUpperCase()=='RADIO'){
          val = $('[name="' + $this.attr('name') + '"]:checked').val();
        }
        else{
          val = $this.val();
        }
        makeRequired($(this), !val);
      });

      initSwipeableLicense();
    });

    initAutoCompletes();
    initDateFields();
    initFileFields();
    bindDynamicFieldset();

    bindCopyFields();
    bindHiddenFields();

    if(typeof window.enableFormValidation != 'undefined' && window.enableFormValidation){
      initClientSideValidation();
    }
  }


  return {
    initPage : initPage
  };

});
