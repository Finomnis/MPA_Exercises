"use_strict";

// (function(){

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
	var windowSize_N = 8192;
	var liveFreqBins = $("#debug_liveFrequencyBins");
	var runningFFT = $("#debug_runningFFT");
	var liveChromaBins = $("#debug_liveChromaBins");
	var audioContext = new (window.AudioContext || window.webkitAudioContext)();
	$("#debug_runningFFT_maxFreq").attr("max", audioContext.sampleRate).val(audioContext.sampleRate).trigger("input");

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
		analyser   = audioContext.createAnalyser();
		source = audioContext.createMediaStreamSource(stream);

		source.connect(analyser);

		startDisplaying();

		console.debug(stream);
		console.debug(analyser);
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

	function display(){
		if(displaying === false || analyser === null)
			return;

		// console.debug(t() + " Drawing frame!");

		analyser.fftSize = windowSize_N;
		var bufferLength = analyser.frequencyBinCount;

		var dataArrayF = new Float32Array(bufferLength);
		var dataArrayB = new Uint8Array(bufferLength);

		analyser.getByteFrequencyData(dataArrayB);
		analyser.getFloatFrequencyData(dataArrayF);

		drawLiveFreq(dataArrayB, liveFreqBins);
		drawRunningFFT(dataArrayB, runningFFT, $("#debug_runningFFT_maxFreq").val());
		drawChromaFeatures(dataArrayB, liveChromaBins);

		window.setTimeout(display, 25);
	}

	var curFFTDrawOffset = 0;
	function drawRunningFFT(data, canvas, maxFreq){
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();
		if(typeof maxFreq === "undefined")
			maxFreq = audioContext.sampleRate

		maxBins = maxFreq * analyser.frequencyBinCount / audioContext.sampleRate; //k = f*N/Fs
		maxBins = maxBins < data.length? maxBins : data.length;

		var timeWidth = 10;
		var freqHeight = canvasHeight/maxBins;

		var canvasCtx = canvas.get(0).getContext("2d");

		canvasCtx.clearRect(curFFTDrawOffset, 0, timeWidth, canvasHeight);
		canvasCtx.fillStyle = 'rgb(0,0,0)';
		canvasCtx.fillRect(curFFTDrawOffset, 0, timeWidth, canvasHeight);

		var max = 0;
		var threshhold = $("#debug_runningFFT_threshold").val();
		for(var i = 0; i < maxBins; i++) {
			// var d = parseInt(255*Math.log(1+10*data[i]/255)/Math.log(11));
			var d = data[i];
			if(d>max)
				max = d;

			if(d <= threshhold)
				continue;

			canvasCtx.fillStyle = 'rgb(' + d + ','+ d +','+ d +')';
			canvasCtx.fillRect(curFFTDrawOffset, canvasHeight-i*(freqHeight), timeWidth, freqHeight);
		}


		canvasCtx.beginPath();
		canvasCtx.lineWidth = "1";
		canvasCtx.strokeStyle = "black";
		canvasCtx.moveTo(curFFTDrawOffset, 0);
		canvasCtx.lineTo(curFFTDrawOffset, canvasHeight);
		canvasCtx.stroke();

		if(max <= threshhold && curFFTDrawOffset == 0){
			return;
		}

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
			if(isNaN(data[i])){
				console.log("data[i] bei i="+i+"== NaN");
				continue;
			}
			barHeight = data[i];

			canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',0,0)';
			canvasCtx.fillRect(x, canvasHeight-barHeight, barWidth, barHeight);

			x += barWidth + 1;
		}
	}

	function drawChromaFeatures(data, canvas){
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();

		var canvasCtx = canvas.get(0).getContext("2d");
		canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

		var barWidth = (canvasWidth / 12);
		var barHeights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var totalSum = 0;

		// data = data.map(function(val){return val*val;});
		// data = data.map(function(val){return Math.log(1+0.5*val);});


		var maxFreq = $("#debug_runningFFT_maxFreq").val();

		for(var i = 0; i < data.length; i++) {
			if(isNaN(data[i])){
				// console.log("data[i] bei i="+i+"== NaN");
				continue;
			}

			totalSum += data[i];

			var chromaBin = (Math.round(12 * Math.log2( (audioContext.sampleRate * (i+1)/windowSize_N) / 440 )) + 69)%12;

			if(chromaBin < 0 || chromaBin > 11){
				// console.log("bin"+chromaBin+" out of range bei i="+i);
				continue;
			}

			barHeights[chromaBin] = barHeights[chromaBin] + data[i];
		}

		var max = Math.max.apply(this, barHeights);
		barHeights = barHeights.map(function(val){return val/max*255});
		// console.log(barHeights);

		var x = 0;
		for(var i=0; i<12; i++){
			if(barHeights[i] == 255){
				canvasCtx.fillStyle = 'rgb(' + (barHeights[i]+100) + ',0,0)';
			}else{
				canvasCtx.fillStyle = 'rgb(0,0,255)';
			}
			// canvasCtx.fillStyle = 'rgb(' + (barHeights[i]+100) + ',0,0)';
			canvasCtx.fillRect(x, canvasHeight-barHeights[i], barWidth, barHeights[i]);

			x += barWidth + 1;
		}

	}

	main();
// })();