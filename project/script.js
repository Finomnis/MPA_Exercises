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
	var liveFreqBins = $("#debug_liveFrequencyBins");
	var runningFFT = $("#debug_runningFFT");

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

		console.debug(t() + " Drawing frame!");

		analyser.fftSize = 4096;
		var bufferLength = analyser.frequencyBinCount;

		var dataArrayF = new Float32Array(bufferLength);
		var dataArrayB = new Uint8Array(bufferLength);

		analyser.getByteFrequencyData(dataArrayB);
		analyser.getFloatFrequencyData(dataArrayF);

		drawLiveFreq(dataArrayB, liveFreqBins);
		drawRunningFFT(dataArrayB, runningFFT);

		window.setTimeout(display, 50);
	}

	var curFFTDrawOffset = 0;
	function drawRunningFFT(data, canvas){
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();

		var timeWidth = 20;
		var freqHeight = canvasHeight/data.length-1;

		var canvasCtx = canvas.get(0).getContext("2d");

		canvasCtx.clearRect(curFFTDrawOffset, 0, timeWidth, canvasHeight);

		console.log(data);

		for(var i = 0; i < data.length; i++) {
			var d = data[i];

			canvasCtx.fillStyle = 'rgb(' + d + ','+ d +','+ d +')';
			canvasCtx.fillRect(curFFTDrawOffset, canvasHeight-i*(freqHeight+1), timeWidth, freqHeight);
		}
		canvasCtx.beginPath();
		canvasCtx.lineWidth = "1";
		canvasCtx.strokeStyle = "black";
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
	}

	main();
// })();