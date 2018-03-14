$(function() {
	"use strict";

	var head = document.getElementsByTagName('head')[0];
	var script;

	script = document.createElement('script');
	script.src="/fontkit.js";
	script.async = true;
	script.onload = function() {
		// thanks Adam! https://github.com/devongovett/fontkit/issues/41
		window.fontkit.openURL = function(url, callback) {
			var font = null;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'arraybuffer';
			xhr.onreadystatechange = function () { if (this.readyState === 4) {
				var buffer;
				if (this.status == 200) {
					buffer = new Buffer(this.response);
					font = fontkit.create(buffer);
					callback(null, font);
				} else {
					callback(this.status + ' ' + this.statusText, null);
				}
			}};
			xhr.send();
		}
	};
	head.appendChild(script);

	var temp; //general use
	
	var controls = $('#controls');
	var logopogo = $('#pogologo');
	
	function loadFontForOutput(callback) {
		if (!window.fontkit) {
			alert("fontkit not loaded; please wait a second and try again.");
			return;
		}
		var fontURL = "/fonts/" + $('#select-font').val() + ".ttf";
		fontkit.openURL(fontURL, function(err, font) {
			if (err) {
				alert('Failed loading font: ' + err);
			} else {
				callback(font);
			}
		});
	}
//https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.4/jspdf.min.js

	function getSVG(font) {
		var xmlns = "http://www.w3.org/2000/svg";

		var text = logopogo.text().trim();

		try {
			var axes = TNTools.fvsToAxes(logopogo.css('font-variation-settings'));
			font = font.getVariation(axes);
		} catch (e) {
			alert(e);
			return;
		}

		var glyphrun = font.layout(text);
		if (glyphrun.glyphs.length <= 0) {
			return;
		}
		var xMin=0, yMin=0, xMax=0, yMax=0;
		var advwidth = 0;
		var paths = [];
		$.each(glyphrun.glyphs, function(i, glyph) {
			paths.push('<path transform="translate(' + advwidth + ',0)" d="' + glyph.path.toSVG() + '"/>');

			xMin = Math.min(xMin, advwidth + glyph.bbox.minX);
			yMin = Math.min(yMin, glyph.bbox.minY);
			xMax = Math.max(xMax, advwidth + glyph.bbox.maxX);
			yMax = Math.max(yMax, glyph.bbox.maxY);
			advwidth += glyph.advanceWidth;
		});
		var viewbox = [xMin, yMin, xMax-xMin, yMax-yMin];

		var svglines = [];
		svglines.push('<?xml version="1.0" standalone="yes" ?>');
		svglines.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">');
		svglines.push('<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="' + viewbox.join(' ') + '" height="' + $('#edit-size').val() + 'px" width="' + ($('#edit-size').val()*viewbox[2]/viewbox[3]) + '">');
		svglines.push('<rect fill="' + $('#background').spectrum('get') + '" x="' + viewbox[0] + '" y="' + viewbox[1] + '" width="' + viewbox[2] + '" height="' + viewbox[3] + '"/>');
		svglines.push('<g stroke="none" fill="' + $('#foreground').spectrum('get') + '" transform="translate(0,' + (viewbox[1]+viewbox[3]) +') scale(1,-1) translate(0,' + (-viewbox[1]) + ')">');
		svglines.push(paths.join("\n"));
		svglines.push('</g>');
		svglines.push('</svg>');
		
		return svglines.join("\n");
	}

	function download(data, filename) {
		var a = document.createElement('a');
		a.style.display='none';
		a.setAttribute('download', filename);
		if (typeof data === 'object') {
			a.href = window.URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
		} else if (typeof data === 'string') {
			a.href = data;
		}
		a.target = '_blank';
		a.textContent = "DOWNLOAD ME";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	$('#save-svg').on('click', function() {
		var text = logopogo.text().trim();
		loadFontForOutput(function(font) {
			var svgdata = getSVG(font).replace(/\n/g, '');
			var url = 'data:image/svg+xml,' + encodeURIComponent(svgdata);
			var filename = ($('#select-font option:selected').text().trim() + '-' + text).replace(/\s+/g, '-') + '.svg';
			download(url, filename);
		});
	});
	
	$('#save-pdf').on('click', function() {
		var text = logopogo.text().trim();
		loadFontForOutput(function(font) {
			if (!window.jsPDF) {
				alert("jsPDF not loaded; please wait a second and try again.");
				return;
			}
			var svgdata = getSVG(font);
			var svgelement = window.asdf = $(svgdata);
			var pdf = jsPDF('l', 'px', 'letter');
			svgElementToPdf(svgelement, pdf, {});
			var filename = ($('#select-font option:selected').text().trim() + '-' + text).replace(/\s+/g, '-') + '.pdf';
			pdf.save(filename);
		});
	});
	
	$('#save-ttf').on('click', function() {
		var text = logopogo.text().trim();
		loadFontForOutput(function(font) {
			var filename = ($('#select-font option:selected').text().trim() + '-' + text).replace(/\s+/g, '-') + '.ttf';	
			download(font.stream.buffer, filename);
		});
	});
});