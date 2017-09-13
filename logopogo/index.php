<?php
namespace TypeNetwork\TypeTools;
require_once("{$_SERVER['DOCUMENT_ROOT']}/tools.inc");

$tools = new TypeTools();

print $tools->pageHead('Logo Pogo')
?>
		<form id='controls'>
			<?= $tools->selectFont() ?>
			<?= $tools->slider([
				'id' => 'size', 'name' => 'size', 'unit' => 'px', 'label' => 'Size',
				'min' => 12, 'max' => 288, 'default' => 72,
			]) ?>
			<?= $tools->slider([
				'id' => 'leading', 'name' => 'leading', 'unit' => 'px', 'label' => 'Leading',
				'min' => 12, 'max' => 288, 'default' => 72,
			]) ?>
			<ul id='axis-inputs'>
			</ul>
			<p><label><input id="everybox" type="checkbox" name="show" value="everything"> Show all axes</label></p>
			<p><label><input id="verbose-fvs" type="checkbox" name="verbose-fvs" value="1" checked> Verbose font-variation-settings</label></p>
			<p><label><input id="show-parameters" type="checkbox" name="show-parameters" value="1"> Show <span style="color:#09f">parameters</span></label></p>
			<p><label><input id="show-css" type="checkbox" name="show-css" value="1"> Show CSS ouptut</label></p>
<!-- 			<p><a id="bookmark" href="?">Bookmark these settings</a></p> -->
			<p><a href="/" id='reset'>Reset to font defaults</a></p>
		</form>
		<h1>Logo Pogo</h1>
		<figure id='pogologo' contenteditable spellcheck="false" data-style="Settings">
			Brand Name
		</figure>
		<div id='save-buttons'>
<!-- 			<h3>Save as:</h3> -->
			<button class="button_default" id='save-svg'>Download SVG</button>
<!--
			<button class="button_default" id='save-pdf'>PDF</button>
			<button class="button_default" id='save-ttf'>TTF</button>
-->
		</div>
		<div id='css-output'></div>
	</body>
</html>
