const Bells = {
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

const PausableTimer = function(callback, delay, runCallbackOnClear) {
	let timerId, start, remaining = delay;

	this.pause = () => {
		window.clearTimeout(timerId);
		timerId = null;
		remaining -= Date.now() - start;
	};

	this.resume = () => {
		if (timerId || remaining <= 0) {
			return;
		}

		start = Date.now();
		timerId = window.setTimeout(callback, remaining);
	};

	this.clear = () => {
		runCallbackOnClear && callback();
		window.clearTimeout(timerId);
	}

	this.resume();
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const timeouts = [];
const notes = [];

let paused = false;
let playSounds = localStorage.getItem("playSounds") === "true";
let showRecurrence = localStorage.getItem("showRecurrence") === "true";

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
		//const noteWrapper = document.createElement("div");
		//noteWrapper.setAttribute("id", "w" + this.id);
		//noteWrapper.setAttribute("style", "position:absolute;width:100%;height:100%;")
		
        const note = document.createElement("div");
        note.setAttribute("style", this.baseStyle);
        note.innerHTML = this.name ? this.name : tone.toUpperCase();
        note.setAttribute("id", this.id);
        note.setAttribute("class", "note");

        //noteWrapper.appendChild(note);
        document.getElementById("canvas").appendChild(note);
    };

    this.animate = () => {
    	//const noteWrapper = document.getElementById("w" + this.id);
    	//noteWrapper.setAttribute("class", "animate");
    
        const note = document.getElementById(this.id);
		note.setAttribute("class", "note animate");
		this.pausedToggle(paused);
        timeouts.push(new PausableTimer(this.addFlair.bind(this), 1575));
		timeouts.push(new PausableTimer(this.playNote.bind(this), 1575));
		timeouts.push(new PausableTimer(this.erase.bind(this), 3200));
    };

	this.pausedToggle = () => {
		const note = document.getElementById(this.id);
		if (note && paused) {
			note.classList.add("pause");
			note.classList.remove("run");
		} else if (note) {
			note.classList.add("run");
			note.classList.remove("pause");
		}
	}
    
    this.addFlair = () => {
        //const note = document.getElementById(this.id);
        //note.innerHTML = "&#128142; " + note.innerHTML + " &#128142;";
        timeouts.push(new PausableTimer(this.removeFlair.bind(this), 300));
    };
    
    this.removeFlair = () => {
        //const note = document.getElementById(this.id);
        //note.innerHTML = note.innerHTML.substring(3,note.innerHTML.length - 2);
    };
    
    this.playNote = () => {
		const oscillator = audioCtx.createOscillator();
		const gain = audioCtx.createGain();

		oscillator.connect(gain);
		gain.connect(audioCtx.destination);
		
		gain.gain.value = 0.5;
		
		oscillator.frequency.value = freq;
		if (playSounds) {
			oscillator.start();
			timeouts.push(new PausableTimer(this.stopNote.bind(this, gain, oscillator), duration, true));
		}
    };
    
    this.stopNote = (gain, oscillator) => {
    	gain && (gain.gain.value = 0);
    	oscillator && timeouts.push(new PausableTimer(() => oscillator.stop(), 100, true));
    };
    
    this.erase = () => {
        const note = document.getElementById(this.id);
    	note && note.parentNode.removeChild(note);
    	//const noteWrapper = document.getElementById("w" + this.id);
    	//noteWrapper.parentNode.removeChild(noteWrapper);
    };
}


function Song(title, song, tempo, tempoBeat) {
	document.getElementById("title").innerHTML = `&#128276;&nbsp;&nbsp;&nbsp;&nbsp;${title}&nbsp;&nbsp;&nbsp;&nbsp;&#128276;`;

	const backAnchor = document.createElement("a");
	backAnchor.setAttribute("style", "position:absolute");
	backAnchor.setAttribute("href", "../All.html");
	backAnchor.innerHTML = "&lt;&lt;";
	document.body.appendChild(backAnchor);

	// Read the lines and figure out note recurrence
	let recurrence = {};
	const determineNoteRecurrence = () => {
		recurrence = {};
		song.forEach(line => {
			for (const part in line) {
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

	const togglePart = e => {
		const title = e.target;
		const part = title.id.split("_")[1];
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

	const getBellDescription = Bell => `${Bell.toUpperCase()}${Bells[Bell].name ? ` - ${Bells[Bell].name}` : ""}`
		+ (showRecurrence ? " - &#215;" + recurrence[Bell] : "");

	const setBellName = e => {
		const Bell = e.target.id;
		Bells[Bell].name = prompt("Name:", Bells[Bell].name || "") ?? Bells[Bell].name;
		e.target.innerHTML = getBellDescription(Bell);

		localStorage.setItem(Bell, Bells[Bell].name);
	};

	const clearBellGuide = () => {
		const bellGuide = document.getElementById("guide");
		while (bellGuide.firstChild) {
			bellGuide.removeChild(bellGuide.firstChild);
		}
	};

	// Set up the Bell Guide at the bottom
	const setupBellGuide = () => {
		for (const Bell in Bells) {
			if (Bells.hasOwnProperty(Bell)) {
				if (recurrence[Bell]) {
					const bell = document.createElement("div");

					if (!Bells[Bell].name) {
						Bells[Bell].name = localStorage.getItem(Bell);
					}

					const description = getBellDescription(Bell);
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
	const lines = song.length;
	song.forEach((line, lineIndex) => {
		for (const part in line) {
			if (line.hasOwnProperty(part)) {
				const thisPart = document.createElement("div");
				thisPart.setAttribute("class", "part");
				thisPart.setAttribute("style", `min-width:${(100 / lines)}%;left:${((100 / lines) * lineIndex)}%;`);
				
				const title = document.createElement("div");
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
	const tempoMinusButton = document.createElement("div");
	const tempoPlusButton = document.createElement("div");
	const tempoVal = document.createElement("div");
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

	// Set up a paused button
	const pausedButton = document.createElement("div");
	pausedButton.setAttribute("id", "paused");
	pausedButton.setAttribute("class", "paused");
	pausedButton.innerHTML = `${paused ? "unpause" :"pause" }`;
	document.getElementById("canvas").appendChild(pausedButton);

	// Set up a mute button
	const muteButton = document.createElement("div");
	muteButton.setAttribute("id", "mute");
	muteButton.setAttribute("class", "mute");
	muteButton.innerHTML = `${playSounds ? "&#128264" :"&#128263" }`;
	document.getElementById("canvas").appendChild(muteButton);

	// Set up a recurrence button
	const recurrenceButton = document.createElement("div");
	recurrenceButton.setAttribute("id", "recurrence");
	recurrenceButton.setAttribute("class", "recurrence");
	recurrenceButton.innerHTML = "#";
	document.getElementById("canvas").appendChild(recurrenceButton);

	// Set up a reset button
	const resetButton = document.createElement("div");
	resetButton.setAttribute("id", "reset");
	resetButton.setAttribute("class", "reset");
	resetButton.innerHTML = "reset";
	document.getElementById("canvas").appendChild(resetButton);
	
	// Read the lines of the song, and start playing
	const play = () => {
		const lines = song.length;
		song.forEach((line, lineIndex) => {
			let noteOffset = 250;
			const width = 90 / lines;
			const left = ((lineIndex * 2) + 1) * (10 / (lines * 2)) + (width * lineIndex);
			for (const part in line) {
				if (song[part] !== false) {
					if (line.hasOwnProperty(part)) {
						line[part].forEach((note, noteIndex) => {
							if (note.n !== "r") {
								const songNote = new Note((lineIndex * 1000) + noteIndex, note.n, Bells[note.n].color, Bells[note.n].name, Bells[note.n].freq, (((note.d * tempoBeat) * (60 / tempo)) * 1000), width, left);
								notes.push(songNote);
								timeouts.push(new PausableTimer(songNote.makeAndAnimate.bind(songNote), noteOffset));
							}
							noteOffset = noteOffset + (((note.d * tempoBeat) * (60 / tempo)) * 1000);
						});
					}
				}
			}
		});
	};

	const tempoMinus = () => {
		tempo = tempo - 10;
		document.getElementById("tempoVal").innerHTML = tempo;
	};

	const tempoPlus = () => {
		tempo = tempo + 10;
		document.getElementById("tempoVal").innerHTML = tempo;
	};

	const pausedToggle = () => {
		paused = !paused;
		document.getElementById("paused").innerHTML = `${paused ? "unpause" :"pause" }`;
		notes.forEach(note => note.pausedToggle());
		timeouts.forEach(timeout => paused ? timeout.pause() : timeout.resume());
	}

	const muteToggle = () => {
		playSounds = !playSounds;
		localStorage.setItem("playSounds", playSounds);
		document.getElementById("mute").innerHTML = `${playSounds ? "&#128264" :"&#128263" }`;
	};

	const recurrenceToggle = () => {
		showRecurrence = !showRecurrence;
		localStorage.setItem("showRecurrence", showRecurrence);
		clearBellGuide();
		setupBellGuide();
	};

	const reset = () => {
		timeouts.forEach(timeout => timeout.clear());
		timeouts.length = 0;
		notes.forEach(note => note.stopNote());
		notes.forEach(note => note.erase());
		notes.length = 0;
		paused = true; pausedToggle();
	};
	
	document.getElementById("title").onclick=play;
	document.getElementById("tempoMinus").onclick=tempoMinus;
	document.getElementById("tempoPlus").onclick=tempoPlus;
	document.getElementById("paused").onclick=pausedToggle;
	document.getElementById("mute").onclick=muteToggle;
	document.getElementById("recurrence").onclick=recurrenceToggle;
	document.getElementById("reset").onclick=reset;
}
