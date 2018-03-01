<?php
namespace TypeNetwork\TypeTools;

/* if (!isset($_SERVER['PHP_AUTH_USER']) or $_SERVER['PHP_AUTH_USER'] !== 'typetools' or $_SERVER['PHP_AUTH_PW'] !== 'variablefonts') {
	header('WWW-Authenticate: Basic realm="Type Tools"');
	header('HTTP/1.0 401 Unauthorized');
	echo 'Go to jail. Do not pass word.';
	exit;
} */

class TypeTools {
	public $fontinfo;
	private $slidercount = 0;
	
	private $registeredAxes = array('opsz', 'wght', 'wdth', 'ital', 'slnt', 'grad', 'GRAD');
	private $includeFonts = array('Amstelvar', 'Escrow', 'Gimlet', 'Dunbar', 'Louvette', 'Decovar', 'Input', 'Momentum');
	
	private $customSettings = array(
		'Amstelvar Alpha' => array(
			'composites' => array(
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
					'35' => array(
						'XTRA' => 42,
						'XOPQ' => 70,
						'YOPQ' => 45,
					),
					'100' => array(),
				),
				'wght' => array(
					'100' => array(
						'XOPQ' => 38,
						'YOPQ' => 25,
						'XTRA' => 375,
						'YTSE' => 8,
					),
					'400' => array(),
					'900' => array(
						'XOPQ' => 250,
						'XTRA' => 250,
						'YTLC' => 525,
					),
				),
			),
		),
	);
	
	public static function requireLogin($user, $password) {
		if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== $user || $_SERVER['PHP_AUTH_PW'] !== $password) {
			header('HTTP/1.1 401 Unauthorized');
			header('WWW-Authenticate: Basic realm="TN Type Tools"');
			echo 'Varfontnügen';
			exit;
		}	
	}

	function __construct() {
		$this->fontinfo = json_decode(file_get_contents("{$_SERVER['DOCUMENT_ROOT']}/fonts/axes.json"));
		$this->fontinfo = get_object_vars($this->fontinfo);
		ksort($this->fontinfo);
			
		$specific_font = false;
		if (preg_match('/^(.+)-var\./', $_SERVER['HTTP_HOST'], $matches)) {
			$specific_font = strtolower($matches[1]);
		}
		
		if (preg_match('/^([^=]+)(&|$)/', $_SERVER['QUERY_STRING'], $m)) {
			$specific_font = strtolower($m[1]);
		}
	
		foreach ($this->fontinfo as $filebase => $axes) {
			if ($specific_font) {
				if (strpos(strtolower($filebase), $specific_font) !== 0) {
					unset($this->fontinfo[$filebase]);
					continue;
				}
			} else if (!preg_match('/^(' . implode('|', $this->includeFonts) . ')/', $filebase)) {
				unset($this->fontinfo[$filebase]);
				continue;
			}
			
/*
			if (!isset($axes->wght) || !isset($axes->wdth)) {
				unset($this->fontinfo[$filebase]);
				continue;
			}
*/
	
			#take off dev stuff from the end of the filename
			//$fontname = preg_replace('/(?:[Vv]\d+|[Aa]lpha|[Bb]eta)?-VF$/', '', $filebase);
			$fontname = preg_replace('/(?:[Vv]\d+)?-VF$/', '', $filebase);
			
			#separate into words
			$fontname = preg_replace('/(?<=[a-z])[_-]?(?=[A-Z])/', ' ', $fontname);

			//figure out axis order
			$order = array();
			
/* //ignore custom orders for now
			if (isset($this->customSettings[$fontname]['order'])) {
				$order = $this->customSettings[$fontname]['order'];
			}
			if (isset($axes->order)) {
				if (!$order) {
					$order = $axes->order;
				}
				@unset($axes->order);
			}
*/

			//reality check on composite axes
			if (isset($this->customSettings[$fontname]['composites'])) {
				foreach ($this->customSettings[$fontname]['composites'] as $composite => $numbers) {
					foreach ($numbers as $pivot => $paxes) {
						foreach ($paxes as $paxis => $number) {
							if (!isset($axes->$paxis)) {
								unset($this->customSettings[$fontname]['composites']);
								break 3;
							}
						}
					}
				}
			}

			if (!$order) {
				unset($axes->order);
				$order = array_keys(get_object_vars($axes));
				usort($order, function($a, $b) {
					//registered, then lowercase, then alphabetic
					// i.e. wght, wdth, opsz, XOPQ, XTRA, YOPQ, YTRA
					$aRegistered = in_array($a, $this->registeredAxes);
					$bRegistered = in_array($b, $this->registeredAxes);
					$aLower = preg_match('/[a-z]/', $a);
					$bLower = preg_match('/[a-z]/', $b);
					if ($aRegistered and !$bRegistered) return -1;
					if ($bRegistered and !$aRegistered) return 1;
					if ($aLower and !$bLower) return -1;
					if ($bLower and !$aLower) return 1;
					if ($a < $b) -1;
					if ($a > $b) 1;
					return 0;
				});
			}


			$this->fontinfo[$filebase] = (object)array(
				'name' => $fontname,
				'axes' => $axes,
				'axisOrder' => $order,
				'composites' => isset($this->customSettings[$fontname]['composites']) ? $this->customSettings[$fontname]['composites'] : array(),
			);
		}
	}

	public function pageHead($title) {
		$whichtool = basename(dirname($_SERVER['SCRIPT_FILENAME']));
	?>
<!DOCTYPE html>
<html lang="en" id="<?= $whichtool ?>">
	<head>
		<meta charset="utf-8">
		<title><?= $title ?></title>
		<meta name="viewport" content="initial-scale=1,shrink-to-fit=no">
		<link rel="stylesheet" href="https://store.typenetwork.com/css/tn.css">
		<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32">
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
		<script src="/opentype.js/dist/opentype.min.js"></script>
		<script src="/spectrum/spectrum.js"></script>
		<link rel="stylesheet" href="/spectrum/spectrum.css">
		<style>
<?php foreach ($this->fontinfo as $filebase => $info): ?>
			@font-face {
				font-family: "<?= $info->name ?> Demo";
				src: url("/fonts/<?= $filebase ?>.woff") format("woff");
			}
<?php endforeach; ?>
		</style>
		<link rel="stylesheet" href="/tools.css">
		<link rel="stylesheet" href="<?= $whichtool ?>.css">
		<script>
			var fontInfo = <?= json_encode($this->fontinfo) ?>;
		</script>
		<script src="/tools.js"></script>
		<script src="<?= $whichtool ?>.js"></script>
	</head>
	<body>
		<h1><a href="/"><img src="/images/typenetwork-logo.svg" alt="Type Network"></a></h1>
<?php
		return "";
	}
	
	public function selectFont($label="Font") {
	?>
			<label for="select-font"><?= $label ?></label>
			<select name="font" id='select-font'>
<?php foreach ($this->fontinfo as $filebase => $info): ?>
				<option value="<?= $filebase ?>"<?php if ($info->name==='Amstelvar') print " selected"; ?>><?= $info->name ?></option>
<?php endforeach ?>
			</select>
			<a href="#custom-fonts" id="custom-fonts-fakeout">Add your own</a>
			<input type='file' name='custom-fonts' id='custom-fonts'>
	<?php
		return "";
	}
	
	public function color($name='color', $color='black', $label='') {
		if (!$label) {
			$label = ucfirst($name);
		}
	?>
		<div class='color'>
			<label><input type='color' id='<?= $name ?>' name='<?= $name ?>' value='<?= $color ?>'> <?= $label ?></label>
		</div>
	<?php
		return "";
	}
	
	public function sizeLeadingColor($size, $leading, $min=8, $max=96 , $fg="#000000", $bg="#ffffff") {
	?>
		<div id='size-leading-color'>
			<label for='edit-size'>Size</label>
			<input type="number" name='size' id='edit-size' min='<?= $min ?>' max='<?= $max ?>' value='<?= $size ?>'>
			<label for='edit-leading'>Leading</label>
			<input type="number" name='leading' id='edit-leading' min='<?= $min ?>' max='<?= ($max*1.5) ?>' value='<?= $leading ?>'>
			<label for='foreground'>FG</label>
			<div class='color'><input type='color' id='foreground' name='foreground' value='<?= $fg ?>'></div>
			<label for='background'>BG</label>
			<div class='color'><input type='color' id='background' name='background' value='<?= $bg ?>'></div>
		</div>
	<?php
		return "";
	}
	
	public function slider($options=array()) {
		if (!is_array($options)) {
			$options = array(
				'id' => $options,
				'name' => $options,
			);
		}
		++$this->slidercount;
		if (empty($options['id'])) {
			$options['id'] = "slider-{$this->slidercount}";
		}
		if (empty($options['name'])) {
			$options['name'] = "slider-{$this->slidercount}";
		}
		if (empty($options['label'])) {
			$options['label'] = ucfirst($options['name']);
		}
	?>
		<div class='slider'>
			<label for="input-<?= $options['id'] ?>"><?= $options['label'] ?></label>
			<label for="edit-<?= $options['id'] ?>"><?= $options['unit'] ?></label>
			<input type='number' id="edit-<?= $options['id'] ?>" name='<?= $options['name'] ?>' min='<?= isset($options['min']) ? $options['min'] : 1 ?>' max='<?= isset($options['max']) ? $options['max'] : 1000 ?>' value='<?= isset($options['default']) ? $options['default'] : 500 ?>'>
			<input type='range' id="input-<?= $options['id'] ?>" name='<?= $options['name'] ?>' min='<?= isset($options['min']) ? $options['min'] : 1 ?>' max='<?= isset($options['max']) ? $options['max'] : 1000 ?>' value='<?= isset($options['default']) ? $options['default'] : 500 ?>' step='<?= isset($options['step']) ? $options['step'] : 1 ?>'>
		</div>
	<?php
		return "";
	}
	
	public function lastFontUpdate() {
		$now = time();
		$then = filemtime("{$_SERVER['DOCUMENT_ROOT']}/fonts/axes.json");
		$date = date("j M", $then);
		$time = date("H:i", $then);
		$diff = $now - $then;
		if ($diff < 60) {
			return $diff == 1 ? "just now" : "$diff seconds ago";
		}
		$diff = floor($diff/60);
		if ($diff < 60) {
			return $diff == 1 ? "1 minute ago" : "$diff minutes ago";
		}
		$diff = floor($diff/24);
		if ($diff < 24) {
			return $diff == 1 ? "1 hour ago" : "$diff hours ago";
		}
		if ($diff < 48) {
			return "yesterday $time";
		}
		return "$date $time";
	}
	
	public function metaLinks() {
	?>
		<p><label><input id="everybox" type="checkbox" name="show" value="everything"> Show all axes</label></p>
		<p><label><input id="verbose-fvs" type="checkbox" name="verbose-fvs" value="1" checked> Verbose font-variation-settings</label></p>
		<p><label><input id="show-parameters" type="checkbox" name="show-parameters" value="1"> Show <span style="color:#09f">parameters</span></label></p>
		<p><label><input id="show-css" type="checkbox" name="show-css" value="1"> Show CSS ouptut</label></p>
		<p><a id="bookmark" href="?">Bookmark these settings</a></p>
		<p><a href="/" id='reset'>Reset to font defaults</a></p>
		<p><a href="/updatefonts.php" id='grab-new-fonts' title="Last updated <?= $this->lastFontUpdate() ?>">Grab latest font files</a></p>
	<?php
		return "";
	}
}