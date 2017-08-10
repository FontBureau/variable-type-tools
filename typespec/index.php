<?php
namespace TypeNetwork\TypeTools;

/*
	if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== 'SND' || $_SERVER['PHP_AUTH_PW'] !== 'Charlotte') {
		header('HTTP/1.1 401 Unauthorized');
		header('WWW-Authenticate: Basic realm="FBVF"');
		echo 'Hello!';
		exit;
	}	
*/
	
	$fontinfo = json_decode(file_get_contents("{$_SERVER['DOCUMENT_ROOT']}/fonts/axes.json"));
	$fontinfo = get_object_vars($fontinfo);
	ksort($fontinfo);
		
	$specific_font = false;
	if (preg_match('/^(.+)-var\./', $_SERVER['HTTP_HOST'], $matches)) {
		$specific_font = strtolower($matches[1]);
	}

	foreach ($fontinfo as $filebase => $axes) {
		if ($specific_font) {
			if (strpos(strtolower($filebase), $specific_font) !== 0) {
				unset($fontinfo[$filebase]);
				continue;
			}
		} else if (!preg_match('/^(Amstelvar|Escrow|Gimlet|Dunbar|Decovar|Input|Momentum)/', $filebase)) {
			unset($fontinfo[$filebase]);
			continue;
		}
		
/*
		if (!isset($axes->wght) || !isset($axes->wdth)) {
			unset($fontinfo[$filebase]);
			continue;
		}
*/

		#take off dev stuff from the end of the filename
		$fontname = preg_replace('/(?:[Vv]\d+|[Aa]lpha|[Bb]eta)?-VF$/', '', $filebase);
		
		#separate into words
		$fontname = preg_replace('/(?<=[a-z])[_-]?(?=[A-Z])/', ' ', $fontname);

		$order = array();
		$composites = array();
		if ($fontname === "Amstelvar") {
			$order = array('opsz', 'wght', 'wdth', 'GRAD', 'XOPQ', 'XTRA', 'YOPQ', 'YTLC', 'YTSE');
			$composites = array(
				'opsz' => array(
					'10' => array(
						'XOPQ' => 110,
						'YOPQ' => 75,
						'YTLC' => 525,
					),
					'14' => array(),
					'72' => array(
						'XTRA' => 300,
						'YOPQ' => 12,
						'YTLC' => 475,
					),
				),
				'wdth' => array(
					'60' => array(
						'XTRA' => 42,
						'XOPQ' => 70,
						'YOPQ' => 45,
					),
					'402' => array(),
				),
				'wght' => array(
					'38' => array(
						'XOPQ' => 38,
						'YOPQ' => 25,
						'XTRA' => 375,
						'YTSE' => 8,
					),
					'88' => array(),
					'250' => array(
						'XOPQ' => 250,
						'XTRA' => 250,
						'YTLC' => 525,
					),
				),
			);
		} else if (isset($axes->order)) {
			$order = $axes->order;
			unset($axes->order);
		} else {
			$order = array_keys(get_object_vars($axes));
			sort($order);
		}
		$fontinfo[$filebase] = (object)array(
			'name' => $fontname,
			'axes' => $axes,
			'axisOrder' => $order,
			'composites' => $composites,
		);
	}
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>Type Specification Demo</title>
		<meta name="viewport" content="initial-scale=1,shrink-to-fit=no">
		<link rel="stylesheet" href="https://store.typenetwork.com/css/tn.css">
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
		<style>
<?php foreach ($fontinfo as $filebase => $info): ?>
			@font-face {
				font-family: "<?= $info->name ?> Demo";
				src: url("/fonts/<?= $filebase ?>.woff") format("woff");
			}
<?php endforeach; ?>
		</style>
		<script>
			var fontInfo = <?= json_encode($fontinfo) ?>;
		</script>
		<link rel="stylesheet" href="typespec.css">
		<style id='demo-style'></style>
		<script src="typespec.js"></script>
	</head>
	<body>
		<h1><img src="/images/typenetwork-logo.svg" alt="Type Network"></h1>
		<form id='controls'>
			<label for="select-font">Font</label>
			<select name="font" id='select-font'>
<?php foreach ($fontinfo as $filebase => $info): ?>
				<option value="<?= $filebase ?>"<?php if ($info->name==='Amstelvar') print " selected"; ?>><?= $info->name ?></option>
<?php endforeach ?>
			</select>
			<div class='slider'>
				<label for="input-column-width">Column width</label>
				<label for="edit-column-width">em</label>
				<input type='number' name='column-width' min='10' max='100' value='40'>
				<input id='input-column-width' type='range' name='column-width' min='10' max='100' value='40' step='0.01'>
			</div>
			<hr>
			<label>Currently editing: <span id='currently-editing'>T2</span></label>
			<div class='slider'>
				<label for="input-size">Size</label>
				<label for="edit-size">px</label>
				<input type='number' name='size' min='8' max='96' value='12'>
				<input id='input-size' type='range' name='size' min='8' max='96' value='12' data-oldval='12'>
			</div>
			<div class='slider'>
				<label for="input-leading">Leading</label>
				<label for="edit-leading">px</label>
				<input type='number' name='leading' min='8' max='144' value='14'>
				<input id='input-leading' type='range' name='leading' min='8' max='144' value='14'>
			</div>
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
			<p><label><input id="show-parameters" type="checkbox" name="show-parameters" value="1"> Show <span style="color:#09f">parameters</span></label></p>
			<p><label><input id="show-css" type="checkbox" name="show-css" value="1"> Show CSS ouptut</label></p>
<!-- 			<p><a id="bookmark" href="?">Bookmark these settings</a></p> -->
			<p><a href="/" id='reset'>Reset to font defaults</a></p>
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
					Intro text which leads reader into the article by the nose, with grace and dignity and a little pithy charm. Typeface has changed to the appropriate optical size by the miracle of modern typography.
				</p>
			</div>
			<div class="T2 row">
				<label>T2</label>
				<div class="container" contenteditable>
					<p>
		Johannes Gutenberg’s work on the printing press began in approximately 1436 when he partnered with Andreas Heilmann, owner of a paper mill. Having previously worked as a goldsmith, Gutenberg made skillful use of the knowledge of metals he had learned as a craftsman. He was the first to make type from an alloy of lead, tin, and antimony, which was critical for producing durable type that produced high-quality printed books and proved to be much better suited for printing than all other known materials.
					</p>
					<p>
		The introduction of mechanical movable type printing led to a huge increase of printing activities across Europe within only a few decades. From a single print shop in Mainz, Germany, printing had spread to no less than around 270 cities in Central, Western and Eastern Europe by the end of the 15th century. As early as 1480, there were printers active in 110 different places in Germany, Italy, France, Spain, the Netherlands, Belgium, Switzerland, England, Bohemia and Poland. From that time on, it is assumed that “the printed book was in universal use in Europe.”
					</p>
					<p>
		The introduction of mechanical movable type printing led to a huge increase of printing activities across Europe within only a few decades. From a single print shop in Mainz, Germany, printing had spread to no less than around 270 cities in Central, Western and Eastern Europe by the end of the 15th century. As early as 1480, there were printers active in 110 different places in Germany, Italy, France, Spain, the Netherlands, Belgium, Switzerland, England, Bohemia and Poland. From that time on, it is assumed that “the printed book was in universal use in Europe.”
					</p>
				</div>
			</div>
		</article>
		<div id='css-output'></div>
	</body>
</html>
