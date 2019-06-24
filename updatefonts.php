<?php
set_time_limit(60);

$start = microtime(true);

exec("python3.6 ~/ttf3web/ttf3web.py --no-munge --axes --formats=woff,woff2 fonts/*.?tf fonts", $output, $err);

if ($err > 0) {
	header("HTTP/1.1 500 Internal Server Error");
	header("Content-type: text/plain; charset=utf-8");
	print implode("\n", $output);
} else {
	$end = microtime(true);
	header("Content-type: text/plain; charset=utf-8");
	print "Run time: " . round($end - $start, 2) . "s";
}
