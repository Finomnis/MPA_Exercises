"use_strict";

(function(){

	//browser compatability
	var browserSupported = false;
	if(typeof navigator.MediaDevices !== "undefined" ){
		browserSupported = true;

		var getUserMedia = function(constraints, success, fail){
			var mediaPromise = navigator.MediaDevices.getUserMedia(constraints);
			mediaPromise.then(success).catch(fail);
		};
	}else{
		navigator.getUserMedia = (navigator.getUserMedia ||
				  navigator.webkitGetUserMedia ||
				  navigator.mozGetUserMedia ||
				  navigator.msGetUserMedia);
		browserSupported = typeof navigator.getUserMedia !== "undefined";

		var getUserMedia = function(constraints, success, fail){
			console.debug("getting media");
			navigator.getUserMedia(constraints, success, fail);
		};
	}

	//'class' variables
	var analyser = null;
	var displaying = false;
	var liveFreqBins = $("#debug_liveFrequencyBins");
	//var runningFFT = $("#debug_runningFFT");

	var beginTime = Date.now()
	function t(){
		return Date.now()-beginTime;
	}

	function main(){
		if(browserSupported === false){
			alert("Sorry, your browser does not (yet?) support the Web Audio API, which this Website requires. Have you tried updating your browser?");
			return;
		}

		getUserMedia({audio: true}, handleStream, handleRejection);
	}

	function handleStream(stream){

		var audioContext = new (window.AudioContext || window.webkitAudioContext)();

                

		analyser   = audioContext.createAnalyser();
		var source = audioContext.createMediaStreamSource(stream);
        src=source;
		source.connect(analyser);

		startDisplaying();

		//console.debug(stream);
		//console.debug(analyser);
	}

	function handleRejection(){
		console.error("Could not aquire user media:", arguments);
	}

	function startDisplaying(){
		if(displaying === false){
			displaying = true;
			display();
		}
	}

	function stopDisplaying(){
		displaying = false;
	}

    function midiToText(midi){
        var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B", "H"];
        var note = midi % 12;
        return notes[note];
    }

    function frequencyToMidi(freq){
        return Math.round(Math.log(freq/440.0)/Math.log(2.0)*12+69);
    } 

    function filterOvertones(maxima){
        result = [];

        for(var i = 0; i < maxima.length; i++){
            currentMax = maxima[i];
            var isOvertone = false;
            for(var j = 0; j < maxima.length; j++){
                if(i == j) continue;
                otherMax = maxima[j];
                if(otherMax.pos > currentMax.pos) continue;
                var closestFactor = Math.round(currentMax.pos / (1.0 * otherMax.pos));
                var estimatedBaseTone = currentMax.pos / (1.0 * closestFactor);
                if(Math.abs(estimatedBaseTone - otherMax.pos) < 2){
                    isOvertone = true;
                }
            }
            if(!isOvertone){
                result.push(currentMax);
            }
        }
        return result;
    }


    function getFrequencyOfBin(binNumber){
        var maxFreq = analyser.context.sampleRate / 2.0;
        var numBins = analyser.frequencyBinCount;
        return (binNumber / (numBins - 1.0)) * maxFreq;
    }

    function extractMaxima(array){

        var maxima = [];

        for(var i = 1; i < array.length-1; i++){
            if(array[i] <= array[i-1] || array[i] <= array[i+1])
                continue;
            
            var strength = 2*array[i]*array[i];

            var abl_max = 0.0;
            var abl_min = 0.0;

            var p = i-1;
            while(p >= 0){
                if(array[p] >= array[p + 1]){
                    strength -= array[p+1]*array[p+1];
                    break;
                }
                var abl = array[p+1] - array[p];
                if(abl > abl_max) abl_max = abl;
                p--;
            }

            p = i + 1;
            while(p < array.length){
                if(array[p] >= array[p - 1]){
                    strength -= array[p-1]*array[p-1];
                    break;
                }
                var abl = array[p] - array[p-1];
                if(abl < abl_min) abl_min = abl;
                p++;
            }
            
            strength = (abl_max - abl_min) * array[i];

            maxima.push({pos:i, strength:strength});
        }

        maxima = maxima.sort(function(a,b){return a.strength < b.strength});
        var highest_maximum = 1;
        if(maxima.length > 0){
            highest_maximum = maxima[Math.min(maxima.length - 1, 1)].strength;
        }
        //console.log(maxima);

        var result_maxima = [];

        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i];
            maximum.strength = Math.round(maximum.strength *255.0 / highest_maximum);
            if(maximum.strength > 20)
                result_maxima.push(maximum);
        }
 
        result_maxima = filterOvertones(result_maxima);

        return result_maxima;

    }


    function precompute(data){
        var output = new Float32Array(data.length);

        var exp10 = Math.exp(10);
        var max_value = 0.0;
        var lowest_valid_bin = data.length;
        var highest_valid_bin = 0;
        for(var i = 0; i < data.length; i++){
            var freq = getFrequencyOfBin(i);
            if(freq < 75 || freq > 1000){
                output[i] = 0.0;
                continue;
            }
            if(i < lowest_valid_bin) lowest_valid_bin = i;
            if(i > highest_valid_bin) highest_valid_bin = i;
            output[i] = Math.exp(data[i]/10) / exp10;

            if(output[i] > max_value){
                max_value = output[i];
            }
        }


        if(max_value == 0.0) max_value = 1.0;
        
        for(var i = 0; i < data.length; i++){
            output[i] = output[i] * 255 / max_value;
        }
        

        return output.slice(0, highest_valid_bin);
    }

	function display(){
		if(displaying === false || analyser === null)
			return;

		//console.debug(t() + " Drawing frame!");

		analyser.fftSize = 4096*4;
        analyser.smoothingTimeConstant = 0.8;
		var bufferLength = analyser.frequencyBinCount;

		var dataArrayF = new Float32Array(bufferLength);
		var dataArrayB = new Uint8Array(bufferLength);

		analyser.getByteFrequencyData(dataArrayB);
		analyser.getFloatFrequencyData(dataArrayF);

        var data = precompute(dataArrayF);

        drawLiveFreq(data, liveFreqBins);
//        drawLiveFreq(dataTArrayB, liveFreqBins);
//		drawRunningFFT(precompute(dataArrayF), runningFFT);

        updateChordGame(data);


		window.setTimeout(display, 50);
	}


    var currentChordGameTarget = false;
    var feedbackText = "<BR><BR><BR>";
    function updateChordGame(data){
       
        if(currentChordGameTarget == false){
                currentChordGameTarget = generateRandomChord();
                resetFindChord();
        }

        var chordResult = findChord(currentChordGameTarget.chord, data);
       
        var chordFoundText = "";
        chordFoundText += "Chord found: " + chordResult.found + "<BR>";

        if(chordResult.found){

            feedbackText = "Correct: " + chordResult.correct + "<BR>";
            feedbackText += "Missing:"
            for(var i = 0; i < chordResult.missing.length; i++){
                if(chordResult.missing[i] == true){
                    feedbackText += " " + midiToText(i);
                }
            }
            feedbackText += "<BR>";
            feedbackText += "Wrong:";
            for(var i = 0; i < chordResult.wrong.length; i++){
                if(chordResult.wrong[i] == true){
                    feedbackText += " " + midiToText(i);
                }
            }
            feedbackText += "<BR>";
        }

        chordFoundText += feedbackText;

        document.getElementById('chordfound_text').innerHTML = chordFoundText;

 
        if(chordResult.found == true){
            if(chordResult.correct){
                currentChordGameTarget = generateRandomChord();
                resetFindChord();
            }
        }


        document.getElementById('chordgame_text').innerHTML = "Please play: " + currentChordGameTarget.name + "<BR>";

    }

	var curFFTDrawOffset = 0;
	function drawRunningFFT(data, canvas){
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();

		var timeWidth = 20;
		var freqHeight = canvasHeight/data.length-1;

		var canvasCtx = canvas.get(0).getContext("2d");

		canvasCtx.clearRect(curFFTDrawOffset, 0, timeWidth, canvasHeight);

		//console.log(data);

		for(var i = 0; i < data.length; i++) {
			var d = 255 - Math.round(data[i]);

			canvasCtx.fillStyle = 'rgb(' + d + ','+ d +','+ d +')';
			canvasCtx.fillRect(curFFTDrawOffset, canvasHeight-i*(freqHeight+1), timeWidth, freqHeight);
		}
		canvasCtx.beginPath();
		canvasCtx.lineWidth = "2";
		canvasCtx.strokeStyle = "white";
		canvasCtx.moveTo(curFFTDrawOffset, 0);
		canvasCtx.lineTo(curFFTDrawOffset, canvasHeight);
		canvasCtx.stroke();

		curFFTDrawOffset += timeWidth;
		if(curFFTDrawOffset >= canvasWidth)
			curFFTDrawOffset = 0;

		canvasCtx.beginPath();
		canvasCtx.lineWidth = "1";
		canvasCtx.strokeStyle = "red";
		canvasCtx.moveTo(curFFTDrawOffset, 0);
		canvasCtx.lineTo(curFFTDrawOffset, canvasHeight);
		canvasCtx.stroke();
        
	}

    function chordEquals(notes1, notes2){
        if(notes1.length != notes2.length) return false;
        for(var i = 0; i < notes1.length; i++){
            if(notes1[i] != notes2[i]) return false;
        }
        return true;
    }
    
    function emptyChord(){
        return [ false, false, false, false, false, false,
                 false, false, false, false, false, false ];
    }

    function powerChord(baseNote){
        var chord = emptyChord();
        chord[baseNote%12] = true;
        chord[(baseNote+8)%12] = true;
        return chord;
    }

    var noteCombinations = [
            [[0, 7], "5"],
            [[0, 7, 4], ""],
            [[0, 7, 3], "m"],
            [[0, 7, 5], "4"],
            [[0, 7, 4, 10], "7"],
            [[0, 7, 4, 11], "maj7"]
        ];


    function resolveChord(midi){

        var inputNotes = emptyChord();

        for(var i = 0; i < midi.length; i++){
            inputNotes[midi[i]%12] = true;
        }

        for(var baseNote = 0; baseNote < 12; baseNote++){
            
            for(var i = 0; i < noteCombinations.length; i++){
                var noteCombination = noteCombinations[i];
                var notes = noteCombination[0];
                var notation = noteCombination[1];
               
                var refNotes = emptyChord(); 

                for(var j = 0; j < notes.length; j++){
                    refNotes[(notes[j]+baseNote)%12] = true;
                }

                if(chordEquals(inputNotes, refNotes)){
                    return midiToText(baseNote) + notation;
                }
            }

        }

        return "--";

    }


    function getMidi(data){

        var maxima = extractMaxima(data);
        var midis = []
        var debugText = "";
        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i].pos;
            var strength = maxima[i].strength;
            
           
            var freq = getFrequencyOfBin(maximum);
            var midi = frequencyToMidi(freq);
            var note = midiToText(midi);
            debugText += "<BR>" + Math.round(freq) + " Hz - "
                         + midi + " - "
                         + note + " - "  + strength;
            midis.push(midi);
        }
        
        debugText = "Resolved Chord: <BR>&nbsp;&nbsp;" + resolveChord(midis) + "<BR><BR>" + debugText;

        document.getElementById('debug_text').innerHTML = debugText + "<BR><BR>";

        return midis;

    }

    function getChord(data){

        var midi = getMidi(data);
        
        var chord = emptyChord();
                
        for(var i = 0; i < midi.length; i++){
            chord[midi[i]%12] = true;
        }

        return chord;

    }

	function drawLiveFreq(data, canvas){
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();

        
		var canvasCtx = canvas.get(0).getContext("2d");

		canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
		canvasWidth = canvasWidth - data.length - 10;

		var barWidth = (canvasWidth / data.length);
		var barHeight;
		var x = 5;

		for(var i = 0; i < data.length; i++) {
			barHeight = data[i];
            

			canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',0,0)';
			canvasCtx.fillRect(x, canvasHeight-barHeight, barWidth, barHeight);

			x += barWidth + 1;
		}
			

        var maxima = extractMaxima(data);
        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i].pos;
            var strength = maxima[i].strength;
            canvasCtx.fillStyle = 'rgb(0,255,0)';
    		canvasCtx.fillRect((barWidth+1) * (maximum+1), canvasHeight-strength, barWidth, strength);
        }

    }


    var currentChord = [];
    var currentChordStartTime = 0;
    var lastDeliveredChord = [];

    function resetFindChord(){
        currentChord = emptyChord();
        currentChordStartTime = new Date().getTime();
        lastDeliveredChord = [];
    }

    function findChord(refChord, data){

        var chord = getChord(data);
        
        if(!chordEquals(chord, currentChord)){

            currentChord = chord;
            currentChordStartTime = new Date().getTime();

            return { found: false };

        }

        var chordDuration = new Date().getTime() - currentChordStartTime;

        if(chordDuration < 200){
            return { found: false };
        }
        
        if(currentChord.length != 12 || chordEquals(currentChord, emptyChord())){
            return { found: false };
        }
        
        if(chordEquals(lastDeliveredChord, currentChord)){
            return { found: false };
        }

        // if arrived here, we found a stable chord.
        // now xor the chord with the reference chord.
        var missing = emptyChord();
        var wrong = emptyChord();
        var correct = true; 
        for(var i = 0; i < chord.length; i++){
            if(chord[i] == refChord[i])
                continue;
                
            correct = false;

            if(refChord[i] == true){
                missing[i] = true;
            } else {
                wrong[i] = true;
            }
        }

        lastDeliveredChord = chord;

        return { found: true, correct: correct, missing: missing, wrong: wrong };

    }


    function generateRandomChord(){

        var baseNote = Math.floor(Math.random() * 12);

        var variant = noteCombinations[Math.floor(Math.random() * noteCombinations.length)];

        var name = midiToText(baseNote) + variant[1];
        var chord = emptyChord();

        var notes = variant[0];
        for(var i = 0; i < notes.length; i++){
            chord[(baseNote + notes[i]) % 12] = true;
        }

        return {name: name, chord: chord};

    }

	main();
 })();
