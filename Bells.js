var Bells = {
	"a low":	{ "color": "020,075,175", "freq": "220.00" },
	"a# low":	{ "color": "025,135,220", "freq": "233.08" },
	"b low":	{ "color": "130,045,100", "freq": "246.94" },
	"c":		{ "color": "175,040,050", "freq": "261.63" },
	"c#":		{ "color": "245,075,110", "freq": "277.18" },
	"d":		{ "color": "250,120,085", "freq": "293.66" },
	"d#":		{ "color": "250,145,110", "freq": "311.13" },
	"e":		{ "color": "255,240,080", "freq": "329.63" },
	"f":		{ "color": "032,177,044", "freq": "349.23" },
	"f#":		{ "color": "122,218,143", "freq": "369.99" },
	"g":		{ "color": "045,158,190", "freq": "392.00" },
	"g#":		{ "color": "065,180,220", "freq": "415.30" },
	"a":		{ "color": "020,075,175", "freq": "440.00" },
	"a#":		{ "color": "025,135,220", "freq": "466.16" },
	"b":		{ "color": "130,045,100", "freq": "493.88" },
	"c high":	{ "color": "175,040,050", "freq": "523.25" },
	"c# high":	{ "color": "245,075,110", "freq": "554.37" },
	"d high":	{ "color": "250,120,085", "freq": "587.33" },	
	"d# high":	{ "color": "250,145,110", "freq": "622.25" },	
	"e high":	{ "color": "255,240,080", "freq": "659.25" },
};

var playSounds = false;
var useNoteNames = true;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var timeouts = [];

function Note(id, tone, color, name, freq, duration, width, left) {
    this.id = "" + id;
    this.color = color;
    this.name = name;
    this.baseStyle = "min-width:" + width + "%;max-width:" + width + "%;z-index:" + id + ";";
    this.baseStyle += "left:" +  left + "%;background-color:rgb(" + this.color + ");";

	this.makeAndAnimate = function() {
		this.make();
		this.animate();
	}
	
	this.make = function() {
		//var noteWrapper = document.createElement("div");
		//noteWrapper.setAttribute("id", "w" + this.id);
		//noteWrapper.setAttribute("style", "position:absolute;width:100%;height:100%;")
		
        var note = document.createElement("div");
        note.setAttribute("style", this.baseStyle);
        note.innerHTML = this.name;
        if (useNoteNames) {
        	note.innerHTML = tone.toUpperCase();
        }
        note.setAttribute("id", this.id);
        note.setAttribute("class", "note");
        
        //noteWrapper.appendChild(note);
        document.getElementById("canvas").appendChild(note);
    }

    this.animate = function() {
    	//var noteWrapper = document.getElementById("w" + this.id);
    	//noteWrapper.setAttribute("class", "animate");
    
        var note = document.getElementById(this.id);
		note.setAttribute("class", "note animate");
        setTimeout(this.addFlair.bind(this), 1575);
        setTimeout(this.playNote.bind(this), 1575);
        setTimeout(this.erase.bind(this), 3200);
    }
    
    this.addFlair = function() {
        var note = document.getElementById(this.id);
        //note.innerHTML = "&#128142; " + note.innerHTML + " &#128142;";
        setTimeout(this.removeFlair.bind(this), 300);
    }
    
    this.removeFlair = function() {
        var note = document.getElementById(this.id);
        //note.innerHTML = note.innerHTML.substring(3,note.innerHTML.length - 2);
    }
    
    this.playNote = function () {
		var oscillator = audioCtx.createOscillator();
		var gain = audioCtx.createGain();

		oscillator.connect(gain);
		gain.connect(audioCtx.destination);
		
		gain.gain.value = 0.5;
		
		oscillator.frequency.value = freq;
		if (playSounds) {
			oscillator.start();
			setTimeout(this.stopNote.bind(this, gain, oscillator), duration);
		}
    },
    
    this.stopNote = function(gain, oscillator) {
    	gain.gain.value = 0;
    	setTimeout(function () { oscillator.stop(); }, 100);
    },
    
    this.erase = function() {
        var note = document.getElementById(this.id);
    	note.parentNode.removeChild(note);
    	//var noteWrapper = document.getElementById("w" + this.id);
    	//noteWrapper.parentNode.removeChild(noteWrapper);
    }
}


function Song(title, song, tempo, tempoBeat) {
	document.getElementById("title").innerHTML = "&#128276;&nbsp;&nbsp;&nbsp;&nbsp;" + title + "&nbsp;&nbsp;&nbsp;&nbsp;&#128276;";
	
	// Read the lines and figure out note recurrence
	var recurrence = {};
	song.forEach(function(line, lineIndex) {
		for (var part in line) {
			if (line.hasOwnProperty(part)) {
				line[part].forEach(function(note, noteIndex) {
					if(note.n !== "r") {
						if(!recurrence[note.n]) { recurrence[note.n] = 0; }
						recurrence[note.n]++;
					}
				});
			}
		}
	});
					
	// Set up the Bell Guide at the bottom
	for (var Bell in Bells) {
		if (Bells.hasOwnProperty(Bell)) {
			if(Bells[Bell].name || recurrence[Bell]) {
				var bell = document.createElement("div");
				var description = Bell + " - " + Bells[Bell].name + " - &#215;" + recurrence[Bell];
				if (useNoteNames) {
		        	description = Bell.toUpperCase() + " - &#215;" + recurrence[Bell];
        		}
				bell.setAttribute("class", "bell");
				bell.setAttribute("style", "background-color:rgb(" + Bells[Bell].color + ");");
				bell.innerHTML = description;
				document.getElementById("guide").appendChild(bell);
			}
		}
	}
	
	// Set up the parts' titles
	var lines = song.length;
	song.forEach(function(line, lineIndex) {
		for (var part in line) {
			if (line.hasOwnProperty(part)) {
				var thisPart = document.createElement("div");
				thisPart.setAttribute("class", "part");
				thisPart.setAttribute("style", "min-width:" + (100 / lines) + "%;left:" + ((100 / lines) * lineIndex )+ "%;");
				
				var title = document.createElement("div");
				title.setAttribute("class", "part_title");
				//title.setAttribute("style", "left:10px;");
				title.innerHTML = part;

				document.getElementById("canvas").appendChild(thisPart);
				thisPart.appendChild(title);
			}
		}
	});
	
	// Set up a tempo buttons
	var tempoMinusButton = document.createElement("div");
	var tempoPlusButton = document.createElement("div");
	var tempoVal = document.createElement("div");
	tempoMinusButton.setAttribute("id", "tempoMinus");
	tempoMinusButton.setAttribute("class", "tempo tempo_minus");
	tempoMinusButton.innerHTML = "-";
	document.getElementById("canvas").appendChild(tempoMinusButton);	
	tempoPlusButton.setAttribute("id", "tempoPlus");
	tempoPlusButton.setAttribute("class", "tempo tempo_plus");
	tempoPlusButton.innerHTML = "+";
	document.getElementById("canvas").appendChild(tempoPlusButton);	
	tempoVal.setAttribute("id", "tempoVal");
	tempoVal.setAttribute("class", "tempo tempo_val");
	tempoVal.innerHTML = tempo;
	document.getElementById("canvas").appendChild(tempoVal);	

	// Set up a reset button
	var resetButton = document.createElement("div");
	resetButton.setAttribute("id", "reset");
	resetButton.setAttribute("class", "reset");
	resetButton.innerHTML = "reset";
	document.getElementById("canvas").appendChild(resetButton);
	
	// Read the lines of the song, and start playing
	var play = function () {
		var lines = song.length;
		song.forEach(function(line, lineIndex) {
			var noteOffset = 250;
			var width = 90 / lines;
			var left = ((lineIndex * 2) + 1) * (10 / (lines * 2)) + (width * lineIndex);
			for (var part in line) {
				if (line.hasOwnProperty(part)) {
					line[part].forEach(function(note, noteIndex) {
						if(note.n !== "r") {
							var songNote = new Note((lineIndex * 1000) + noteIndex, note.n, Bells[note.n].color, Bells[note.n].name, Bells[note.n].freq, (((note.d * tempoBeat) * (60 / tempo)) * 1000), width, left);
							timeouts.push(setTimeout(songNote.makeAndAnimate.bind(songNote), noteOffset));
						}
						noteOffset = noteOffset + (((note.d * tempoBeat) * (60 / tempo)) * 1000);
					});
				}
			}
		});
	};
	
	var tempoMinus = function () {
		tempo = tempo - 10;
		document.getElementById("tempoVal").innerHTML = tempo;
	};

	var tempoPlus = function () {
		tempo = tempo + 10;
		document.getElementById("tempoVal").innerHTML = tempo;
	};
	
	var reset = function () {
		timeouts.forEach(function(timeout) {
			clearTimeout(timeout);
		});
		timeouts = [];
	};
	
	document.getElementById("title").onclick=play;
	document.getElementById("tempoMinus").onclick=tempoMinus;
	document.getElementById("tempoPlus").onclick=tempoPlus;
	document.getElementById("reset").onclick=reset;
};