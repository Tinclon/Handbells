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
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var timeouts = [];

function Note(id, tone, color, name, freq, duration, width, left) {
    this.id = "" + id;
    this.color = color;
    this.name = name;
    this.baseStyle = `min-width:${width}%;max-width:${width}%;z-index:${id};`;
    this.baseStyle += `left:${left}%;background-color:rgb(${this.color});`;

	this.makeAndAnimate = () => {
		this.make();
		this.animate();
	};
	
	this.make = () => {
		//var noteWrapper = document.createElement("div");
		//noteWrapper.setAttribute("id", "w" + this.id);
		//noteWrapper.setAttribute("style", "position:absolute;width:100%;height:100%;")
		
        var note = document.createElement("div");
        note.setAttribute("style", this.baseStyle);
        note.innerHTML = this.name ? this.name : tone.toUpperCase();
        note.setAttribute("id", this.id);
        note.setAttribute("class", "note");
        
        //noteWrapper.appendChild(note);
        document.getElementById("canvas").appendChild(note);
    };

    this.animate = () => {
    	//var noteWrapper = document.getElementById("w" + this.id);
    	//noteWrapper.setAttribute("class", "animate");
    
        var note = document.getElementById(this.id);
		note.setAttribute("class", "note animate");
        setTimeout(this.addFlair.bind(this), 1575);
        setTimeout(this.playNote.bind(this), 1575);
        setTimeout(this.erase.bind(this), 3200);
    };
    
    this.addFlair = () => {
        var note = document.getElementById(this.id);
        //note.innerHTML = "&#128142; " + note.innerHTML + " &#128142;";
        setTimeout(this.removeFlair.bind(this), 300);
    };
    
    this.removeFlair = () => {
        var note = document.getElementById(this.id);
        //note.innerHTML = note.innerHTML.substring(3,note.innerHTML.length - 2);
    };
    
    this.playNote = () => {
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
    };
    
    this.stopNote = (gain, oscillator) => {
    	gain.gain.value = 0;
    	setTimeout(() => oscillator.stop(), 100);
    };
    
    this.erase = () => {
        var note = document.getElementById(this.id);
    	note.parentNode.removeChild(note);
    	//var noteWrapper = document.getElementById("w" + this.id);
    	//noteWrapper.parentNode.removeChild(noteWrapper);
    };
}


function Song(title, song, tempo, tempoBeat) {
	document.getElementById("title").innerHTML = `&#128276;&nbsp;&nbsp;&nbsp;&nbsp;${title}&nbsp;&nbsp;&nbsp;&nbsp;&#128276;`;

	var backAnchor = document.createElement("a");
	backAnchor.setAttribute("style", "position:absolute");
	backAnchor.setAttribute("href", "../All.html");
	backAnchor.innerHTML = "&lt;&lt;";
	document.body.appendChild(backAnchor);

	// Read the lines and figure out note recurrence
	var recurrence = {};
	var determineNoteRecurrence = () => {
		recurrence = {};
		song.forEach(line => {
			for (var part in line) {
				if(song[part] !== false) {
					if (line.hasOwnProperty(part)) {
						line[part].forEach(note => {
							if (note.n !== "r") {
								if (!recurrence[note.n]) {
									recurrence[note.n] = 0;
								}
								recurrence[note.n]++;
							}
						});
					}
				}
			}
		});
	};
	determineNoteRecurrence();

	var togglePart = e => {
		var title = e.target;
		var part = title.id.split("_")[1];
		song[part] = !(song[part] !== false);

		if (song[part]) {
			title.setAttribute("class", "part_title");
		} else {
			title.setAttribute("class", "part_title part_title_dim");
		}
		determineNoteRecurrence();
		clearBellGuide();
		setupBellGuide();
	};

	var getBellDescription = Bell => `${Bell.toUpperCase()}${Bells[Bell].name ? ` - ${Bells[Bell].name}` : ""}`;// + " - &#215;" + recurrence[Bell];

	var setBellName = e => {
		var Bell = e.target.id;
		Bells[Bell].name = prompt("Name:");
		e.target.innerHTML = getBellDescription(Bell);

		localStorage.setItem(Bell, Bells[Bell].name);
	};

	var clearBellGuide = () => {
		var bellGuide = document.getElementById("guide");
		while (bellGuide.firstChild) {
			bellGuide.removeChild(bellGuide.firstChild);
		}
	};

	// Set up the Bell Guide at the bottom
	var setupBellGuide = () => {
		for (var Bell in Bells) {
			if (Bells.hasOwnProperty(Bell)) {
				if (recurrence[Bell]) {
					var bell = document.createElement("div");

					if (!Bells[Bell].name) {
						Bells[Bell].name = localStorage.getItem(Bell);
					}

					var description = getBellDescription(Bell);
					bell.setAttribute("id", Bell);
					bell.setAttribute("class", "bell");
					bell.setAttribute("style", `cursor:pointer;background-color:rgb(${Bells[Bell].color});`);
					bell.innerHTML = description;
					document.getElementById("guide").appendChild(bell);
					document.getElementById(Bell).onclick = setBellName;
				}
			}
		}
	};
	setupBellGuide();
	
	// Set up the parts' titles
	var lines = song.length;
	song.forEach((line, lineIndex) => {
		for (var part in line) {
			if (line.hasOwnProperty(part)) {
				var thisPart = document.createElement("div");
				thisPart.setAttribute("class", "part");
				thisPart.setAttribute("style", `min-width:${(100 / lines)}%;left:${((100 / lines) * lineIndex)}%;`);
				
				var title = document.createElement("div");
				title.setAttribute("id", `part_${part}`);
				title.setAttribute("class", "part_title");
				title.setAttribute("style", "cursor:pointer;");
				//title.setAttribute("style", "left:10px;");
				title.innerHTML = part;

				document.getElementById("canvas").appendChild(thisPart);
				thisPart.appendChild(title);
				document.getElementById(`part_${part}`).onclick=togglePart;
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
	var play = () => {
		var lines = song.length;
		song.forEach((line, lineIndex) => {
			var noteOffset = 250;
			var width = 90 / lines;
			var left = ((lineIndex * 2) + 1) * (10 / (lines * 2)) + (width * lineIndex);
			for (var part in line) {
				if(song[part] !== false) {
					if (line.hasOwnProperty(part)) {
						line[part].forEach((note, noteIndex) => {
							if (note.n !== "r") {
								var songNote = new Note((lineIndex * 1000) + noteIndex, note.n, Bells[note.n].color, Bells[note.n].name, Bells[note.n].freq, (((note.d * tempoBeat) * (60 / tempo)) * 1000), width, left);
								timeouts.push(setTimeout(songNote.makeAndAnimate.bind(songNote), noteOffset));
							}
							noteOffset = noteOffset + (((note.d * tempoBeat) * (60 / tempo)) * 1000);
						});
					}
				}
			}
		});
	};

	var tempoMinus = () => {
		tempo = tempo - 10;
		document.getElementById("tempoVal").innerHTML = tempo;
	};

	var tempoPlus = () => {
		tempo = tempo + 10;
		document.getElementById("tempoVal").innerHTML = tempo;
	};

	var reset = () => {
		timeouts.forEach(timeout => clearTimeout(timeout));
		timeouts = [];
	};
	
	document.getElementById("title").onclick=play;
	document.getElementById("tempoMinus").onclick=tempoMinus;
	document.getElementById("tempoPlus").onclick=tempoPlus;
	document.getElementById("reset").onclick=reset;
}