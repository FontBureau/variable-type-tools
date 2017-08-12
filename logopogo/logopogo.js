$(function() {
	"use strict";

	var temp; //general use
	
	var controls = $('#controls');
	var logopogo = $('#pogologo');
	
	if (!$('#style-pogologo').length) {
		$('head').append("<style id='style-pogologo'></style>");
	}
	
	function slidersToElement() {
		TNTools.slidersToElement({
			'selector': '#pogologo',
			'styleElement': $('#style-pogologo'),
			'paramsElement': $('#pogologo')
		});
	}

	controls.on('change input', 'input[type=range], input[type=number]', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));
		if (this.type === 'range' && this.name === 'size') {
			var leading = parseFloat($('#input-leading').val());
			var oldval = parseFloat($(this).data('oldval'));
		}
		TNTools.handleSliderChange(evt);
		slidersToElement();
	});
	
	$("input[type=radio]").on('change', slidersToElement);
	
	$('#show-parameters').on('change', function() {
		logopogo[this.checked ? 'addClass' : 'removeClass']('show-parameters');
	}).trigger('change');

	$('#show-css').on('change', function() {
		$('#css-output')[this.checked ? 'show' : 'hide']();
	}).trigger('change');

	//font change triggers a lot of updates
	$('#select-font').on('change', function() {
		var font = $(this).val();

		$('head style[id^="style-"]').empty();
		$('input[type=checkbox]').prop('checked',false).trigger('change');
		$('#align-left').prop('checked',true);

		//populate axis sliders with font defaults
		$('#axis-inputs').empty();

		TNTools.populateAxisSliders(font, false);
		
		$('#input-size').trigger('change');
		slidersToElement();
	}).trigger('change');

	$('#reset').on('click', function() {
		$('#select-font').trigger('change');
		return false;
	});
});