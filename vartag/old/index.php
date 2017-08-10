<?php
/*
	if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== 'SND' || $_SERVER['PHP_AUTH_PW'] !== 'Charlotte') {
		header('HTTP/1.1 401 Unauthorized');
		header('WWW-Authenticate: Basic realm="FBVF"');
		echo 'Hello!';
		exit;
	}	
*/
	
	$defaultStyles = array();
	
	$anchor = $defaultStyles[""] = array(
		'name' => "All",
		'size' => 14,
	);

	$defaultStyles["h1"] = array(
		'name' => "Headline",
		'size' => 4,
/*
		'wdth' => 0.7,
		'wght' => 2,
		'GRAD' => 1.0,
*/
	);

	$defaultStyles["h2"] = array(
		'name' => "Subhead",
		'size' => 2.5,
/*
		'wdth' => 0.85,
		'wght' => 1.18,
		'GRAD' => 1.0,
*/
	);

	$defaultStyles["h3"] = array(
		'name' => "Deck",
		'size' => 1.5,
/*
		'wdth' => 0.95,
		'wght' => 1.18,
		'GRAD' => 1.0,
*/
	);

	$defaultStyles["p.reversed"] = array(
		'name' => "Reversed Body",
		'size' => 1.0,
		'wdth' => 1.0,
		'wght' => 1.0,
		'GRAD' => 1.06,
	);

	$defaultStyles["p"] = array(
		'name' => "Body",
		'size' => 1.0,
		'wdth' => 1.0,
		'wght' => 1.0,
		'GRAD' => 1.0,
	);

	$defaultStyles["aside"] = array(
		'name' => "Small",
		'size' => 0.75,
		'wdth' => 1.0,
		'wght' => 1.0,
		'GRAD' => 1.0,
	);

	$defaultStyles["aside.reversed"] = array(
		'name' => "Reversed Small",
		'size' => 0.75,
		'wdth' => 1.0,
		'wght' => 1.0,
		'GRAD' => 1.06,
	);

	$fontinfo = json_decode(file_get_contents("fonts/axes.json"));
	$fontinfo = get_object_vars($fontinfo);
	ksort($fontinfo);
		
	$specific_font = false;
	if (preg_match('/^(.+)-var\./', $_SERVER['HTTP_HOST'], $matches)) {
		$specific_font = strtolower($matches[1]);
	}
	
	foreach ($fontinfo as $filebase => $axes) {
		if ($specific_font and strpos(strtolower($filebase), $specific_font) !== 0) {
			unset($fontinfo[$filebase]);
			continue;
		}
/*
		if (!isset($axes->wght) || !isset($axes->wdth)) {
			unset($fontinfo[$filebase]);
			continue;
		}
*/
		if (preg_match('/^(.+?)(?:[Vv]\d+|[Aa]lpha|[Bb]eta)?-VF$/', $filebase, $matches)) {
			$fontname = preg_replace('/(?<=[a-z])[_-]?(?=[A-Z])/', ' ', $matches[1]);
		} else {
			$fontname = preg_replace('/(?<=[a-z])[_-]?(?=[A-Z])/', ' ', $filebase);
		}
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
					'14' => array(
					),
					'72' => array(
						'XTRA' => 300,
						'YOPQ' => 12,
						'YTLC' => 475,
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
		<title>Vartag</title>
		<meta name="viewport" content="initial-scale=1,shrink-to-fit=no">
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
			var defaultStyles = <?= json_encode($defaultStyles) ?>;
		</script>
		<link rel="stylesheet" href="css.css">
		<script src="js.js"></script>
<?php foreach ($defaultStyles as $rule => $info): ?>
		<style id="style-<?= preg_replace('/[\W-]+/', '-', $rule) ?>-style"></style>
<?php endforeach; ?>
	</head>
	<body>
		<form id='controls'>
			<label>Currently editing: <span id='currently-editing'>All</span></label>
			<label for="select-font">Font</label>
			<select name="font" id='select-font'>
<?php foreach ($fontinfo as $filebase => $info): ?>
				<option value="<?= $filebase ?>"<?php if ($info->name==='Amstelvar') print " selected"; ?>><?= $info->name ?></option>
<?php endforeach ?>
			</select>
			<p><label><input type="checkbox" name="lock" id='lock' checked> Adjust all styles</label></p>
			<div class='slider'>
				<label for="input-size">Size</label>
				<label for="edit-size">pt</label>
				<input type='number' name='size' min='8' max='96' value='12'>
				<input id='input-size' type='range' name='size' min='8' max='96' value='12'>
			</div>
			<ul id='axis-inputs'>
			</ul>
			<p><label><input id="everybox" type="checkbox" name="show" value="everything"> Show all axes</label></p>
			<p><a id="bookmark" href="?">Bookmark these settings</a></p>
			<p><a href="/" id='reset'>Reset to font defaults</a></p>
		</form>
		<article contenteditable spellcheck="false">
			<h1>The <cite>Charlotte Caterwauler</cite></h1>
			<h1>Stormy Session in Seattle</h1>
			<h2>Parsley Growers Show Decline in Online Revenues</h2>
			<h3>Solutions Found for Patent Infringement by 5 Major Farms</h3>
			<p>
Johannes Gutenberg’s work on the printing press began in approximately 1436 when he partnered with Andreas Heilmann, owner of a paper mill. Having previously worked as a goldsmith, Gutenberg made skillful use of the knowledge of metals he had learned as a craftsman. He was the first to make type from an alloy of lead, tin, and antimony, which was critical for producing durable type that produced high-quality printed books and proved to be much better suited for printing than all other known materials.
			</p>
			<p class="reversed">
Johannes Gutenberg’s work on the printing press began in approximately 1436 when he partnered with Andreas Heilmann, owner of a paper mill. Having previously worked as a goldsmith, Gutenberg made skillful use of the knowledge of metals he had learned as a craftsman. He was the first to make type from an alloy of lead, tin, and antimony, which was critical for producing durable type that produced high-quality printed books and proved to be much better suited for printing than all other known materials.
			</p>
			<aside>
The introduction of mechanical movable type printing led to a huge increase of printing activities across Europe within only a few decades. From a single print shop in Mainz, Germany, printing had spread to no less than around 270 cities in Central, Western and Eastern Europe by the end of the 15th century. As early as 1480, there were printers active in 110 different places in Germany, Italy, France, Spain, the Netherlands, Belgium, Switzerland, England, Bohemia and Poland. From that time on, it is assumed that “the printed book was in universal use in Europe.”
			</aside>
			<aside class="reversed">
The introduction of mechanical movable type printing led to a huge increase of printing activities across Europe within only a few decades. From a single print shop in Mainz, Germany, printing had spread to no less than around 270 cities in Central, Western and Eastern Europe by the end of the 15th century. As early as 1480, there were printers active in 110 different places in Germany, Italy, France, Spain, the Netherlands, Belgium, Switzerland, England, Bohemia and Poland. From that time on, it is assumed that “the printed book was in universal use in Europe.”
			</aside>
		</article>
	</body>
</html>
