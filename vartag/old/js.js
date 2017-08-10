function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

var temp;
var showAxes = ['wdth', 'wght', 'GRAD'];
var currentStyles = clone(defaultStyles);
var zeroAxes = {};
var activeStyle = '';
var show = "";
var absoluteValues = false;

//these get updated whenever the font changes
var composites = {};
var axisDefaults = {};

//composite axis and value
function compositeToParametric(caxis, cvalue) {
	cvalue = parseFloat(cvalue);
	
	if (!(caxis in composites)) {
		var temp = {};
		temp[caxis] = cvalue;
		return temp;
	}

	//maintain a list of all axes mentioned in the composite, so we can reset them all
	var allAxes = {};	
	
	var lowerPivot, upperPivot;
	var lowerAxes, upperAxes;
	//pivot value and axes
	$.each(composites[caxis], function(pivot, paxes) {
		pivot = parseFloat(pivot);
		
		//add any new axes to the list
		$.each(paxes, function(paxis, pval) {
			if (!(paxis in allAxes)) {
				allAxes[paxis] = axisDefaults[paxis].default;
			}
		});
		
		if (pivot >= cvalue) {
			//first time this happens we can stop
			if (!upperPivot) {
				upperPivot = pivot;
				upperAxes = paxes;
			}
		}
		
		if (!lowerPivot || !upperPivot) {
			//first runthru OR we still haven't found the top of the range
			lowerPivot = pivot;
			lowerAxes = paxes;
		}
	});

	var result = {};
	if (!upperPivot) {
		upperPivot = lowerPivot;
		upperAxes = lowerAxes;
	} else if (!lowerPivot) {
		lowerPivot = upperPivot;
		lowerAxes = upperAxes;
	}
	$.each(allAxes, function(axis, dflt) {
		var u = axis in upperAxes ? upperAxes[axis] : dflt;
		var l = axis in lowerAxes ? lowerAxes[axis] : dflt;
		var r = upperPivot === lowerPivot ? 0.0 : (cvalue-lowerPivot)/(upperPivot-lowerPivot);
		result[axis] = l + r*(u-l);
		if (axisDefaults[axis].max - axisDefaults[axis].min > 50) {
			result[axis] = Math.round(result[axis]);
		}
	});

	return result;
}

$(function() {
	var axisInputs = $('#axis-inputs');
	var styleElements = $('article > *');
	var bodyEl = $('article > p:not(.reversed)').first();
	
	if (temp=window.location.search.match(/show=([^&]+)/)) {
		show = decodeURIComponent(temp[1]);
		$('input[name=show][value="' +show+ '"]').prop('checked', true);
	}

	function realUpdateURL() {
			$('#bookmark').attr('href', '?settings=' + encodeURIComponent(JSON.stringify(currentStyles)) + '&show=' + show);
	}
	
	var urltimeout;
	function updateURL() {
		urltimeout && clearTimeout(urltimeout);
		urltimeout = setTimeout(realUpdateURL, 500);
	}

	function makeId(str) {
		return 'style-' + str.replace(/[\W-]+/g, '-') + '-style';
	}

	function updateStyles() {
		updateURL();
		
		var anchor = currentStyles[""];
		var displayAnchor = currentStyles["p"];
		
		// figure font-variation-settings
		$.each(currentStyles, function(style, axes) {
			var rules = [];
			var fvs = {};
			$.each(anchor, function(axis, defaultValue) {
				var absValue, storedValue = currentStyles[style][axis];

				switch (axis) {
				case 'name':
					break;
				case 'font':
					if (style === "") {
						rules.push('font-family: "' + fontInfo[storedValue].name + ' Demo"');
					}
					break;
				case 'size':
					//don't set independent sizes on subclassed elements
					rules.push('font-size: ' + storedValue + (style === "" ? 'pt' : 'em'));
					$.each(compositeToParametric('opsz', style === "" ? storedValue : storedValue * anchor.size), function(k,v) {
						fvs[k] = v;
					});
					break;
				default:
					if (style === "") {
						absValue = storedValue || defaultValue;
					} else if (zeroAxes[axis]) {
						absValue = defaultValue + (storedValue || 0.0);
					} else {
						absValue = defaultValue * (storedValue || 1.0);
					}
					//if it's already been added by a composite, only override if value is not default
					if (!(axis in fvs) || absValue !== axisDefaults[axis].default) {
						fvs[axis] = absValue;
					}
					break;
				}
			});

			var fvsa = [];
			$.each(fvs, function(k,v) {
				fvsa.push('"' + k + '" ' + v);
			})
			
			rules.push('font-variation-settings: ' + fvsa.join(', '));
			
			$('#' + makeId(style)).text('article ' + style + ' { ' + rules.join('; ') + '; }');
		});


		//and update the displayed values
		styleElements.each(function() {
			var el = $(this);
			var label;
			if (label = defaultStyles[this.tagName.toLowerCase()]) {
				el.attr('data-el', label.name);
			} else if (this.tagName === 'P') {
				el.attr('data-el', 'Body');
			} else if (this.tagName === 'ASIDE') {
				el.attr('data-el', 'Small');
			}
			
			if (absoluteValues || (this.tagName === 'P' && !el.hasClass('reversed'))) {
				el.attr('data-size', Math.round(parseFloat(el.css('font-size')) * 72/96) + 'pt');
			} else {
				el.attr('data-size', Math.round(parseFloat(el.css('font-size'))/parseFloat($('article').css('font-size'))*100) + '%');
			}

			var dataaxes = [];
			$.each(currentStyles, function(style, axes) {
				if (!el.is(style || "article")) return;
				if (style.indexOf('.') < 0 && el.hasClass('reversed')) return;
				
				//reset this on each go-round because we only want to save the last one
				dataaxes = [];
				$.each(anchor, function(axis, anchorVal) {
					var storedValue = axes[axis];
					var relativeDisplayAnchor = displayAnchor[axis]
					var absDisplayAnchor, absValue, relativeValue;
					
					if (axis !== 'size' && axis !== 'name' && $('#input-' + axis).is(':visible')) {
						if (zeroAxes[axis]) {
							absDisplayAnchor = anchorVal + (relativeDisplayAnchor || 0.0);
							absValue = anchorVal + (storedValue || 0.0);
							relativeValue = absValue - absDisplayAnchor;
						} else {
							absDisplayAnchor = anchorVal * (relativeDisplayAnchor || 1.0);
							absValue = anchorVal * (storedValue || 1.0);
							relativeValue = absValue / absDisplayAnchor;
						}

						if (absoluteValues || (style === 'p' && !el.hasClass('reversed'))) {
							dataaxes.push(axis + ' ' + Math.round(1000*absValue)/1000);
						} else if (zeroAxes[axis]) {
							dataaxes.push(axis + ' ' + (relativeValue >= 0 ? '+' + relativeValue : relativeValue));
						} else {
							dataaxes.push(axis + ' ' + (relativeValue >= 1 ? '+' : '') + Math.round((relativeValue-1)*1000) + "‰");
						}
					}
				});
			});
			el.attr('data-axes', dataaxes.join(', ') || 'everything else 100%');
		});
	}

	$('#lock').on('change', function() {
		$(this.checked ? 'article' : bodyEl).trigger('click');
	});
	
	//add stylesheets for the various styles
	$(styleElements).add("article").on('click', function(evt) {
		var el = $(this);
		evt.stopPropagation();
		
		//toggle absolute/relative values
		if (evt.pageY && evt.pageY < el.offset().top) {
			absoluteValues = !absoluteValues;
			updateStyles();
			return false;
		}
		
		//update sliders
		var style = this.tagName.toLowerCase();
		styleElements.removeClass('current');
		if (this.className) {
			style += '.' + this.className;
		}
		if (this.tagName === 'ARTICLE') {
			style = '';
			$('#lock').prop('checked', true);
			styleElements.removeClass('current');
		} else {
			$('#lock').prop('checked', false);
			el.addClass('current');
		}
		activeStyle = style;
		
		$('#currently-editing').text(currentStyles[activeStyle].name);
		
		var testEl = $(('article ' + style).trim());
		var fvs = testEl.css('font-variation-settings').split(/, */);
		
		$('input[name=size], input[name=opsz]').val(Math.round(parseFloat(testEl.css('font-size'))*72/96)); //.prop('disabled', style.indexOf('.') >= 0);
		
		$.each(fvs, function(i, setting) {
			if (temp = setting.match(/["'](\w{4})['"]\s+([\-\d\.]+)/)) {
				$('input[name="' + temp[1] + '"]').val(temp[2]);
			}
		});
		
		$('#input-size').trigger('change'); // does optical size magic
	});
	
	$('#controls').on('change input', 'input[type=range], input[type=number]', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));

		//make sure manually entered numbers stay within okay range
		if (constrained !== this.value) {
			$(this).on('blur', function() {
				this.value = constrained;
				$(this).off('blur');
			});
		}

		//match up sliders with text inputs
		$(this).siblings('input[name="' + this.name + '"]').val(this.value);
		
		//deconstruct composite axes into their individual parameters
		if (this.name in composites) {
			$.each(compositeToParametric(this.name, this.value), function(paxis, pvalue) {
				var anchor = currentStyles[""][paxis];
				$('input[name="' + paxis + '"]').val(pvalue);
				if (activeStyle === "") {
					currentStyles[activeStyle][paxis] = pvalue;
				} else if (zeroAxes[paxis]) {
					currentStyles[activeStyle][paxis] = pvalue - anchor;
				} else {
					currentStyles[activeStyle][paxis] = pvalue / anchor;
				}
			});
		} else {
			var anchor = currentStyles[""][this.name];
			if (activeStyle === "") {
				currentStyles[activeStyle][this.name] = constrained;
			} else if (zeroAxes[this.name]) {
				currentStyles[activeStyle][this.name] = constrained - anchor;
			} else {
				currentStyles[activeStyle][this.name] = constrained / anchor;
			}
		}
		
		if (this.name === 'size' && $('input[name="opsz"]').length) {
			$('input[name="opsz"]').val(this.value).trigger(evt.type);
		} else {
			updateStyles();
		}
	});
	
	$('#everybox').on('change', function () {
		if (this.checked) {
			show = this.value;
			$('#axis-inputs .hidden-by-default').show();
		} else {
			show = '';
			$('#axis-inputs .hidden-by-default').hide();
		}
		updateStyles();
	});

	//font change triggers a lot of updates
	$('#select-font').on('change', function() {
		var font = $(this).val();
		
		//reset all styles to defaults
		var previousStyles = clone(currentStyles);

		currentStyles = clone(defaultStyles);
		currentStyles[""].font = font;
		
		//populate axis sliders with font defaults
		axisInputs.empty();
		zeroAxes = {};

		composites = fontInfo[font].composites;
		axisDefaults = fontInfo[font].axes;
		
		$.each(fontInfo[font].axisOrder, function(i, axis) {
			var values = fontInfo[font].axes[axis];

			currentStyles[""][axis] = values.default;
			
			if (values.min <= 0 && values.max >= 0) {
				zeroAxes[axis] = true;
			}
			
			var li = document.createElement('li');
			li.className = 'slider ' + axis;
			
			if (showAxes.indexOf(axis) < 0) {
				li.className += ' hidden-by-default';
				if (show !== 'everything') {
					li.style.display = 'none';
				}
			}

			var label = document.createElement('label');
			var slider = document.createElement('input');
			var editlabel = document.createElement('label');
			var editvalue = document.createElement('input');
			
			label.for = slider.id = "input-" + axis;				
			label.textContent = values.name || axis;

			editlabel.for = editvalue.id = "edit-" + axis;
			editlabel.textContent = axis;
			
			editvalue.type = 'number';
			slider.type = 'range';

			editvalue.name = slider.name = axis;
			editvalue.min = slider.min = values.min;
			editvalue.max = slider.max = values.max;
			editvalue.step = slider.step = values.max-values.min > 50 ? 1 : (values.max-values.min)/100;
			editvalue.value = slider.value = values.default;

			if (axis in composites) {
				
			}

			li.appendChild(label);
			li.appendChild(editlabel);
			li.appendChild(editvalue);
			li.appendChild(slider);
			axisInputs.append(li);
		});

		//copy over old settings as possible
/*
		$.each(previousStyles, function(style, axes) {
			$.each(currentStyles[""], function(axis, fontValue) {
				var input = $('#input-' + axis);
				if (!input.length) return;
				var min = input.attr('min');
				var max = input.attr('max');
				var anchor = currentStyles[""][axis];
				var prevVal = previousStyles[style][axis] || (style === "" ? anchor : 1.0);
				if (style === "") {
					currentStyles[style][axis] = Math.max(min, Math.min(max, prevVal));
				} else {
					currentStyles[style][axis] = Math.max(min/anchor, Math.min(max/anchor, prevVal));
				}
				if (style === "") {
					input.val(currentStyles[style][axis]);
				}
			});
		});
*/

		updateStyles();
	}).trigger('change');

	//see if we have an incoming url
	if (temp = window.location.search.match(/settings=([^&]+)/)) {
		try {
			//save bookmarked settings
			temp = JSON.parse(decodeURIComponent(temp[1]));
			//change font to setup sliders (resets values)
			$('#select-font').val(temp[""].font).trigger('change');
			//restore saved values
			currentStyles = temp;
			//make everything look good
			updateStyles();
			//update sliders to match actual css
			$('article').trigger('click');
		} catch (e) {
// 							console.log(e);
		}
	}
	
	$('#reset').on('click', function() {
		$('#select-font').trigger('change');
		return false;
	});
});