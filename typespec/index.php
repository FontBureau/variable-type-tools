<?php
namespace TypeNetwork\TypeTools;
require_once("{$_SERVER['DOCUMENT_ROOT']}/tools.inc");

$tools = new TypeTools();

print $tools->pageHead('Type Specification Demo')
?>
		<form id='controls'>
			<?= $tools->selectFont() ?>
			<?= $tools->slider([
				'id' => 'column-width', 'name' => 'column-width', 'unit' => 'em', 'label' => 'Column width',
				'min' => 10, 'max' => 80, 'default' => 40, 'step' => 0.1,
			]) ?>
			<hr>
			<label>Currently editing: <span id='currently-editing'>T2</span></label>
			<?= $tools->slider([
				'id' => 'size', 'name' => 'size', 'unit' => 'px', 'label' => 'Size',
				'min' => 8, 'max' => 96, 'default' => 12,
			]) ?>
			<?= $tools->slider([
				'id' => 'leading', 'name' => 'leading', 'unit' => 'px', 'label' => 'Leading',
				'min' => 8, 'max' => 144, 'default' => 14,
			]) ?>
			<?= $tools->color('foreground', '#000000'); ?>
			<?= $tools->color('background', '#ffffff'); ?>
			<div id='alignment-controls' class="slider_container">
				<label>Alignment</label>
				<input id='align-left' type='radio' checked name='alignment' value='left'>
				<label for='align-left'>L</label>
				<input id='align-center' type='radio' name='alignment' value='center'>
				<label for='align-center'>C</label>
				<input id='align-right' type='radio' name='alignment' value='right'>
				<label for='align-right'>R</label>
				<input id='align-justify' type='radio' name='alignment' value='justify'>
				<label for='align-justify'>J</label>
			</div>
			<ul id='axis-inputs'>
			</ul>
			<p><label><input id="everybox" type="checkbox" name="show" value="everything"> Show all axes</label></p>
			<p><label><input id="verbose-fvs" type="checkbox" name="verbose-fvs" value="1" checked> Verbose font-variation-settings</label></p>
			<p><label><input id="show-parameters" type="checkbox" name="show-parameters" value="1"> Show <span style="color:#09f">parameters</span></label></p>
			<p><label><input id="show-css" type="checkbox" name="show-css" value="1"> Show CSS ouptut</label></p>
<!-- 			<p><a id="bookmark" href="?">Bookmark these settings</a></p> -->
			<p><a href="/" id='reset'>Reset to font defaults</a></p>
			<p><a href="/updatefonts.php" id='grab-new-fonts' title="Last updated <?= $tools->lastFontUpdate() ?>">Grab latest font files</a></p>
		</form>
		<article spellcheck="false">
			<div class="H1 row">
				<label>H1</label>
				<h1 contenteditable>Heading One</h1>
			</div>
			<div class="H2 row">
				<label>H2</label>
				<h2 contenteditable>Heading Two</h2>
			</div>
			<div class="H3 row">
				<label>H3</label>
				<h3 contenteditable>Heading Three</h3>
			</div>
			<div class="T1 row">
				<label>T1</label>
				<p class="lede" contenteditable>
					Intro text leads reader into the article by the nose, with grace and dignity and a little pithy charm. Typeface has changed to the appropriate optical size by the miracle of modern typography.
				</p>
			</div>
			<div class="T2 row">
				<label>T2</label>
				<div class="container" contenteditable>
					<p>Johannes Gutenberg’s work on the printing press began in approximately 1436 when he partnered with Andreas Heilmann, owner of a paper mill. Having previously worked as a goldsmith, Gutenberg made skillful use of the knowledge of metals he had learned as a craftsman. He was the first to make type from an alloy of lead, tin, and antimony, which was critical for producing durable type that produced high-quality printed books and proved to be much better suited for printing than all other known materials.
					</p>
					<p>The introduction of mechanical movable type printing led to a huge increase of printing activities across Europe within only a few decades. From a single print shop in Mainz, Germany, printing had spread to no less than around 270 cities in Central, Western and Eastern Europe by the end of the 15th century. As early as 1480, there were printers active in 110 different places in Germany, Italy, France, Spain, the Netherlands, Belgium, Switzerland, England, Bohemia and Poland. From that time on, it is assumed that “the printed book was in universal use in Europe.”
					</p>
					<p>Two ideas altered the design of the printing press radically: First, the use of steam power for running the machinery, and second the replacement of the printing flatbed with the rotary motion of cylinders. Both elements were first successfully implemented by the German printer Friedrich Koenig in a series of press designs devised between 1802 and 1818, with assistance from engineer Andreas Friedrich Bauer. Koenig and Bauer sold two of their first models to The Times in London in 1814, capable of 1,100 impressions per hour. The first edition so printed was on 28 November 1814.
					</p>
				</div>
			</div>
		</article>
		<div id='css-output'></div>
	</body>
</html>
