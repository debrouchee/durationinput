/*
DurationInput 1.1
Copyright (c) 2014 Dennis Dohle
Last changes: 22.01.2015
*/
(function($){

	$.fn.durationinput = function(options) {

		var plugin = this;
		var input = $(this); /* Input-Feld mit String */
		var errors = []; /* Fehler bei der Eingabe */
		var minTotal = 0; /* Gesamtminuten */

		// Einstellungen
		var settings = $.extend({
			delay: 700, /* Zeitverzögerung für den Errechnungsprozess */
			overwriteInputValue: true, /* Errechnete formatierte Zeit mit Eingabe überschreiben */
			resultInput: $(this).next(':hidden'), /* Input-Objekt für die errechnete Minutenzahl */
			resultTextSuccessObj: $(this), /* Errechnete formatierte Zeit in diesem Text-Container ausgeben */
			resultTextErrorObj: false, /* Fehlertexte in diesem  Text-Container ausgeben */
			periods: ['d', 'h', 'min'], /* Reihenfolge ist für Ausgabe wichtig */
			periodDefault: 'min', /* Bei Eingaber einer Zahl wird diese Einheit als Standard verwendet */
			periodResult: null, /* Welche maximale Zeiteinheit soll im Ausgabetext stehen */
			afterCalculation: null, /* Callback-Event */
			max: null, /* Maximale Zeitangaben, z.B. 8h oder 60min oder 5d */
			minSteps: 1, /* Aufrundung der Minutenzahl auf diesen nächst höheren Wert */
			hSteps: 0, /* Aufrundung der Stundenzahl auf diesen nächst höheren Wert */
			dSteps: 0, /* Aufrundung der Tageszahl auf diesen nächst höheren Wert */
			dHours: 24, /* Ein Tag hat diese Stunden -> z.B. bei Arbeitstagen = 8 */
			minText: 'min',
			minTextMulti: 'min',
			hText: 'h',
			hTextMulti: 'h',
			dText: 'T',
			dTextMulti: 'T',
			resultSuccessClass: 'c-green', /* CSS-Klasse */
			resultErrorClass: 'c-red', /* CSS-Klasse */
			inputSuccessClass: 'success', /* CSS-Klasse */
			inputErrorClass: 'error', /* CSS-Klasse */
			errorTextInvalid: 'Der Zeitwert konnte nicht erkannt werden.',
			errorTextNoValueNoPeriod: 'Kein Wert und Zeiteinheit gefunden.',
			errorTextNoValue: 'Keinen Wert zur Zeiteinheit ($0) gefunden.',
			errorTextNoPeriod: 'Keine Zeiteinheit zum Wert ($0) gefunden.',
			errorTextPeriodNotValid: 'Zeiteinheit ($0) ungültig.',
			errorTextMinMax: 'Die Dauer $0 überschreitet den maximalen Wert von $1.',
			resultDefaultText: ''
		}, options);

		/* Standard-Text des Text-Objekt ermitteln */
		if (settings.resultTextSuccessObj && settings.resultTextSuccessObj.html().length > 0) {
			settings.resultDefaultText = settings.resultTextSuccessObj.html();
		}

		/* Wert vorhanden */
		if (settings.resultInput) {
			var min = settings.resultInput.val();
			if (min) { showResult(min); }
		}

		/* Event auf Input */
		input.keyup(function(){
			var obj = $(this);
			delay(function(){
				calculateString( obj.val() );
			}, settings.delay);
		});

		/* Initialisierung, bzw. Reset */
		function startCalculation() {
			minTotal = 0;
			errors = [];
			if (settings.resultInput) settings.resultInput.val('');
			if (settings.inputSuccessClass) input.removeClass(settings.inputSuccessClass);
			if (settings.inputErrorClass) input.removeClass(settings.inputErrorClass);
		}

		/* String auswerten und Zeitblöcke finden */
		function calculateString(string) {
			startCalculation();
			var string = $.trim(string);
			string = string.replace(/\s{2,}/g, ' ');

			if (string.length == 0) return;

			if (string) {
				// Zeitblöcke definieren
				string = string.toLowerCase();
				string = string.replace(',', '.');
				var parts = [];
				var part = { value: '', period: '' };
				var chars = string.split('');
				var chars_count = chars.length;
				var char_current, error;
				var part_period_exists = false;

				// Reine Ziffer und Standard-Einheit vorhanden
				if (settings.periodDefault && string.match(/^[0-9.]+$/) != null) {
					part = { value: string, period: settings.periodDefault };
					parts.push( part );
				}
				// Analysieren
				else {
					for (var i = 0; i < chars_count; i++) {
						char_current = chars[i];
						if (char_current.match(/^[0-9.]+$/) != null) {
							if (part_period_exists) {
								parts.push( part );
								part = { value: '', period: '' };
								part_period_exists = false;
							}
							part.value += '' + char_current;
						} else if (char_current.match(/^[a-z]+$/i) != null) {
							part.period += '' + char_current;
							part_period_exists = true;
						}
					}
					if (part_period_exists && part.value) {
						parts.push( part );
					}
				}

				// Zeitblöcke gefunden -> Errechnung der Minutenzahl
				if (parts.length > 0) {
					var value, period, d, h, min;
					for (var k = 0; k < parts.length; k++) {
						value = parts[k].value;
						period = parts[k].period;
						d, h, min = false;

						if (!value && !period) { addError(settings.errorTextNoValueNoPeriod); }
						else if (!value) { addError( settings.errorTextNoValue.replace("$0", period) ); }
						else if (!period) { addError( settings.errorTextNoPeriod.replace("$0", value) ); }

						switch(period) {
							case 'm': case 'mi': case 'min': case 'minu': case 'minute': case 'minutes': case 'minuten':
								if ($.inArray('min', settings.periods) !== -1) {
									if (settings.minSteps) { value = roundTo(value, settings.minSteps); }
									if (value > 0) minTotal += value;
									break;
								}
							case 'h': case 'ho': case 'hou': case 'hour': case 'hours': case 'hr': case 's': case 'st': case 'stu': case 'stund': case 'stunde': case 'stunden':
								if ($.inArray('h', settings.periods) !== -1) {
									if (settings.hSteps) { value = roundTo(value, settings.hSteps); }
									if (value > 0) {
										min = value * 60;
										if (settings.minSteps) { min = roundTo(min, settings.minSteps); }
										minTotal += min;
									}
									break;
								}
							case 'd': case 'da': case 'day': case 'days': case 't': case 'ta': case 'tag': case 'tage':
								if ($.inArray('d', settings.periods) !== -1) {
									if (settings.dSteps) { value = roundTo(value, settings.dSteps); }
									if (value > 0) {
										min = value * settings.dHours * 60;
										if (settings.minSteps) { min = roundTo(min, settings.minSteps); }
										minTotal += min;
									}
									break;
								}
							default:
								addError( settings.errorTextPeriodNotValid.replace("$0", period) );
						}
					}
				}
				// String nicht identifizierbar
				else {
					addError( settings.errorTextInvalid );
				}
			}

			/* Prüfen, ob maximaler Wert überschritten wird */
			if (settings.max) {
				var value = settings.max.match(/[0-9]+/g);
				var period = settings.max.match(/[a-z]+/g);
				if (value && period) {
					value = value * 1;
					minMax = 0;
					if (period == 'min') minMax = value;
					else if (period == 'h') minMax = value * 60;
					else if (period == 'd') minMax = value * settings.dHours * 60;
					if (minMax && minTotal > minMax) {
						error = settings.errorTextMinMax;
						error = error.replace("$0", formatMinutes(minTotal, ' und ') );
						error = error.replace("$1", formatMinutes(minMax, ' und ', period) );
						addError( error );
					}
				}
			}

			/* Kalkulierten Wert in Form-Feld einfügen, sofern keine Fehler aufgetreten sind */
			if (errors.length == 0) {
				if (settings.resultInput) { settings.resultInput.val(minTotal); }
			}
			else {
				minTotal = false;
			}

			/* Kalkulierten Wert oder Fehler anzeigen */
			showResult(minTotal);

			/* Event nach Kalkulation */
			if (settings.afterCalculation) { settings.afterCalculation(input, minTotal); }
		}

		/* Fehler hinzufügen */
		function addError(error) {
			errors.push(error);
		}

		/* Kalkulierten Wert oder Fehler anzeigen */
		function showResult(min) {
			var value, period_visible;
			if (settings.resultTextSuccessObj) settings.resultTextSuccessObj.html('');
			if (settings.resultTextErrorObj) settings.resultTextErrorObj.html('');
			if (errors.length > 0) {
				input.addClass(settings.inputErrorClass);
				if (settings.resultTextErrorObj) settings.resultTextErrorObj.append('<div class="' + settings.resultErrorClass + '">' + errors.join('<br>') + '</div>');
			}
			else if (min !== false) {
				input.addClass(settings.inputSuccessClass);
				if (settings.overwriteInputValue) input.val( formatMinutes(min) );
				if (settings.resultTextSuccessObj) settings.resultTextSuccessObj.html('<div class="' + settings.resultSuccessClass + '">' + formatMinutes(min) + '</div>');
			}
			if (settings.resultTextSuccessObj && settings.resultTextSuccessObj.html().length == 0) {
				settings.resultTextSuccessObj.html(settings.resultDefaultText);
			}
		}

		/* Kalkulierte Minutenzahl als schönen lesbaren Text anzeigen */
		function formatMinutes(min, separator, max_period) {
			var h, d;
			if (separator == undefined) separator = ' ';
			if (max_period == undefined || !max_period) max_period = settings.periodResult;
			if (min > 59 && max_period != 'min') {
				h = Math.floor(min / 60);
				min = min - (h * 60);
				if (h > (settings.dHours - 1) && max_period != 'h') {
					d = Math.floor(h / settings.dHours);
					h = h - (d * settings.dHours);
				}
			}
			var items = [];
			if (d > 0) {
				if (d == 1) items.push(d + ' ' + settings.dText);
				else items.push(d + ' ' + settings.dTextMulti);
			}
			if (h > 0) {
				if (h == 1) items.push(h + ' ' + settings.hText);
				else items.push(h + ' ' + settings.hTextMulti);
			}
			if (min > 0 || (min == 0 && !h && !d) ) {
				if (min == 1) items.push(min + ' ' + settings.minText);
				else items.push(min + ' ' + settings.minTextMulti);
			}
			if (items.length == 0) return false;
			var string = items.join(separator);
			return string;
		}

		/* Wert auf nächst höheren Schritt runden */
		function roundTo(number, step) {
			number = parseInt(number);
			return Math.ceil(number / step) * step;
		}

		/* Verzögerung für Eingabe */
		var delay = (function(){
			var timer = 0;
			return function(callback, ms){
				clearTimeout (timer);
				timer = setTimeout(callback, ms);
			};
		})();

		/* Globalisierung */
		$.fn.showResult = function(min) {
			return showResult(min);
		}

		/* Globalisierung */
		$.fn.formatMinutes = function(min) {
			return formatMinutes(min);
		}

		return this;

	};

}(jQuery));