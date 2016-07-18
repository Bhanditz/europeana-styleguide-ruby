define(['jquery'], function ($) {
	
    function log(msg) {
        console.log(msg);
    }

    function setFieldValueStatus(id, status){
    	$('#' + id).removeClass('field_value_valid').removeClass('field_value_invalid').removeClass('field_value_suspicious')
    	
    	switch (status) {
			case "Valid": 
				$('#' + id).addClass('field_value_valid'); 
				break;
			case "Suspicious": 
				$('#' + id).addClass('field_value_suspicious'); 
				break;
			case "Invalid": 
				$('#' + id).addClass('field_value_invalid'); 
			    break;
			default:
				log('switch does not match');
		}
    }
    
    function bindTableCellClick(){
    	$('.field-value-cell .dropdown-menu a').on('click', function(e){
          e.preventDefault();
    	  var $el = $(e.target);
    	  var val = $el.text();
    	  var $cell = $el.closest('.field-value-cell');
    	  var cellId = $cell.attr('id');
    	  setFieldValueStatus(cellId, val);
    	});
    	
    }
    
    function expandCollapseMappingCard() {
        $('.mapping-widget-expanded').hide();
    	$('.values-expand').click(function() {
    		$('.mapping-widget-expanded').slideToggle('1000');
    		$('.mapping-widget-collapsed').hide();
    	});
    	
    	$('.values-collapse').click(function() {
    		$('.mapping-widget-expanded').hide();
    		$('.mapping-widget-collapsed').show();
    	});
    }
    
	function pageInit() {
      
	  log('in page init');
      $(window).on('scroll', function() {
        log('close open menus here...')
      });
      
      require(['jqDropdown'], function() {
        bindTableCellClick();
      });

      require(['eu_tooltip'], function(euTooltip){
        euTooltip.configure();
      });

      require(['util_ellipsis'], function(EllipsisUtil){
        var ellipsis = EllipsisUtil.create(  '.eu-tooltip-anchor' );
      });
      
      expandCollapseMappingCard();
    }
    
	function selectView() {
		
	}
	
	return {
		pageInit: function() {
			pageInit();
		}
	}    
});