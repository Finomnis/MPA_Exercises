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

    function getFrequencyOfBin(binNumber){
        var maxFreq = analyser.context.sampleRate / 2.0;
        var numBins = analyser.frequencyBinCount;
        return (binNumber / (numBins - 1.0)) * maxFreq;
    }

    function computeMean(array){
        var sum = 0.0;
        for(var i = 0; i < array.length; i++){
            sum += array[i];
        }
        return sum/array.length;
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

        var highest_maximum = 0.0;
        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i];
            if(maximum.strength > highest_maximum)
                highest_maximum = maximum.strength;
        }

        var result_maxima = [];

        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i];
            maximum.strength = Math.round(maximum.strength *255.0 / highest_maximum);
            if(maximum.strength > 10)
                result_maxima.push(maximum);
        }
 
        return result_maxima;

    }


    function computeMedian(array){
        var arr = new Array(array.length);
        for(var i = 0; i < array.length; i++){
            arr[i] = array[i];
        }
        arr = arr.sort()
        return arr[Math.round(arr.length/2.0)];
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
            var tmp = Math.exp(data[i]/10) / exp10;
            //tmp = tmp * tmp;
            output[i] = tmp;

//            output[i] = output[i] - output[Math.round(i/2.0)]
//                                  - output[Math.round(i/3.0)]
//                                  - output[Math.round(i/4.0)];
            if(output[i] < 0){
                 output[i] = 0;
            }
//            output[i] = Math.sqrt(output[i]);

            if(output[i] > max_value){
                max_value = output[i];
            }
        }

        
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

        //var dataTArray = new Float32Array(bufferLength);
        //var dataTArrayB = new Uint8Array(bufferLength);
        //analyser.getByteTimeDomainData(dataTArrayB);

        drawLiveFreq(precompute(dataArrayF), liveFreqBins);
//        drawLiveFreq(dataTArrayB, liveFreqBins);
//		drawRunningFFT(precompute(dataArrayF), runningFFT);

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

		//console.log(data);

		for(var i = 0; i < data.length; i++) {
			var d = 255 - Math.round(data[i]);

			canvasCtx.fillStyle = 'rgb(' + d + ','+ d +','+ d +')';
            //if(i == 10)console.log('rgb(' + d + ','+ d +','+ d +')');
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

	function drawLiveFreq(data, canvas){
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();

        var maxima = extractMaxima(data);
//        console.log(maxima);
        
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

        //console.log(maxima.length);
        var debugText = "";
        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i].pos;
            var strength = maxima[i].strength;
            
			canvasCtx.fillStyle = 'rgb(0,255,0)';
			canvasCtx.fillRect((barWidth+1) * (maximum+1), canvasHeight-strength, barWidth, strength);
           
            var freq = getFrequencyOfBin(maximum);

            debugText += "<BR>" + Math.round(freq) + " Hz - " + strength;
        }
        document.getElementById('debug_text').innerHTML = debugText + "<BR><BR>";

	}

	main();
// })();
