<?php
namespace TypeNetwork\TypeTools;
require_once("{$_SERVER['DOCUMENT_ROOT']}/tools.inc");

$tools = new TypeTools();

print $tools->pageHead('Problem Solved')
?>
		<form id='controls'>
			<?= $tools->selectFont() ?>
			<?= $tools->sizeLeadingColor(16, 22, 8, 28); ?>
			<ul id='axis-inputs'>
			</ul>
			<?= $tools->metaLinks() ?>
		</form>
		<section class='problem' id='justification'>
			<h2>Justification using <code>XTRA</code></h2>
			<p>
				Adjust the font to your liking using the controls at the left, then check “Lock lines” to adjust word spaces.
			</p>
			<form id='justification-controls' class='controls'>
				<label><input type='checkbox' name='highlight-spaces'> Highlight spaces</label>
			</form>
			<aside>Spaces: 
				min <span id='min-space-width'></span>
				med <span id='med-space-width'></span>
				avg <span id='avg-space-width'></span>
				max <span id='max-space-width'></span>
			</aside>
			<figure contenteditable spellcheck="false">
				<p>
					Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er
					sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag
					auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig
					hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen
					geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen
					Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im
					Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten
					ihm hilflos vor den Augen.
				</p>
				<p>
					»Was ist mit mir geschehen?« dachte er. Es war kein Traum. Sein Zimmer,
					ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen
					den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine
					auseinandergepackte Musterkollektion von Tuchwaren ausgebreitet war—Samsa
					war Reisender—, hing das Bild, das er vor kurzem aus einer
					illustrierten Zeitschrift ausgeschnitten und in einem hübschen,
					vergoldeten Rahmen untergebracht hatte. Es stellte eine Dame dar, die,
					mit einem Pelzhut und einer Pelzboa versehen, aufrecht dasaß und einen
					schweren Pelzmuff, in dem ihr ganzer Unterarm verschwunden war, dem
					Beschauer entgegenhob.
				</p>
				<p>
					Gregors Blick richtete sich dann zum Fenster, und das trübe Wetter—man
					hörte Regentropfen auf das Fensterblech aufschlagen—machte ihn
					ganz melancholisch. »Wie wäre es, wenn ich noch ein wenig
					weiterschliefe und alle Narrheiten vergäße,« dachte er, aber das war
					gänzlich undurchführbar, denn er war gewöhnt, auf der rechten Seite zu
					schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in
					diese Lage bringen. Mit welcher Kraft er sich auch auf die rechte Seite
					warf, immer wieder schaukelte er in die Rückenlage zurück. Er versuchte
					es wohl hundertmal, schloß die Augen, um die zappelnden Beine nicht
					sehen zu müssen, und ließ erst ab, als er in der Seite einen noch nie
					gefühlten, leichten, dumpfen Schmerz zu fühlen begann.
				</p>
				<p>
					»Ach Gott,« dachte er, »was für einen anstrengenden Beruf habe ich
					gewählt! Tag aus, Tag ein auf der Reise. Die geschäftlichen Aufregungen
					sind viel größer, als im eigentlichen Geschäft zu Hause, und außerdem
					ist mir noch diese Plage des Reisens auferlegt, die Sorgen um die
					Zuganschlüsse, das unregelmäßige, schlechte Essen, ein immer
					wechselnder, nie andauernder, nie herzlich werdender menschlicher
					Verkehr. Der Teufel soll das alles holen!« Er fühlte ein leichtes Jucken
					oben auf dem Bauch; schob sich auf dem Rücken langsam näher zum
					Bettpfosten, um den Kopf besser heben zu können; fand die juckende
					Stelle, die mit lauter kleinen weißen Pünktchen besetzt war, die er
					nicht zu beurteilen verstand; und wollte mit einem Bein die Stelle
					betasten, zog es aber gleich zurück, denn bei der Berührung umwehten ihn
					Kälteschauer.
				</p>
		</figure>
	</body>
</html>
