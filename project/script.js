// "use strict";

window.Midi = (function(){

    function Midi(pitch){
        this.pitch = pitch;
    }

    //================= STATIC PRIVATE METHODS ========================
    /** @brief removes overtones of any tone which has not been considered an overtone yet
    */
    function filterOvertones(maxima){
        var result = [];

        for(var i = 0; i < maxima.length; i++){
            var currentMax = maxima[i];
            var isOvertone = false;
            for(var j = 0; j < maxima.length; j++){
                if(i == j) continue;
                var otherMax = maxima[j];
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

    function drawLiveFreq(data, maxima){
        var canvas = $("#debug_liveFrequencyBins");
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

        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i].pos;
            var strength = maxima[i].strength;
            canvasCtx.fillStyle = 'rgb(0,255,0)';
            canvasCtx.fillRect((barWidth+1) * (maximum+1), canvasHeight-strength, barWidth, strength);
        }

    }

    /** @brief extracts maxima from fft histogram and removes overtones
    */
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

    var clazz = Midi;


    var notes = clazz.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B♭", "B"];
    //================= STATIC PUBLIC METHODS ========================
    /** @brief returns a midi instance corresponding to a frequency
    */
    var fromFreq = clazz.fromFreq = function(freq){
        return new Midi(Math.round(Math.log(freq/440.0)/Math.log(2.0)*12+69));
    }

    /** @brief returns a list of Midi instances from a fft data vector
    */
    var fromSpectrum = clazz.fromSpectrum = function (data){
        var maxima = extractMaxima(data);
        var midis = []
        var debugText = "";
        for(var i = 0; i < maxima.length; i++){
            var maximum = maxima[i].pos;
            var strength = maxima[i].strength;


            var freq = game.getFrequencyOfBin(maximum);
            var midi = Midi.fromFreq(freq);
            var note = midi.toString();
            debugText += "<BR>" + Math.round(freq) + " Hz - "
                         + midi.pitch + " - "
                         + note + " - "  + strength;
            midis.push(midi);
        }

        document.getElementById('debug_text').innerHTML = debugText + "<BR><BR>";
        drawLiveFreq(data, maxima);

        return midis;

    }

    //================= PUBLIC METHODS ========================
    function toString(){
        return notes[this.pitch % 12];
    }

    Midi.prototype.constructor = Midi;
    Midi.prototype.toString = toString;

    return Midi;
})();

window.Chord = (function(){

    var noteCombinations = [
            {notes:[0, 7],  name: "5"},
            {notes:[0, 7, 4], name:  ""},
            {notes:[0, 7, 3],  name: "m"},
            {notes:[0, 7, 5],  name: "4"},
            {notes:[0, 7, 3, 10],  name: "m7"},
            {notes:[0, 7, 4, 10],  name: "7"},
            {notes:[0, 7, 4, 11],  name: "maj7"}
        ];

    function Chord(){
        this.tones = [ false, false, false, false, false, false,
                 false, false, false, false, false, false ];
    }

    var clazz = Chord;

    //================= STATIC PUBLIC METHODS ========================
    /** @brief returns a Chord with no notes in it
    */
    var emptyChord = clazz.emptyChord = function(){
        return new Chord();
    }

    /** @brief returns a Chord according to the name
    */
    var fromName = clazz.fromName = function(name){
        var chord = new Chord();

        var baseNote = Midi.notes.indexOf(name.substr(0,2));
        if(baseNote == -1)
            baseNote = Midi.notes.indexOf(name.substr(0,1));
        if(baseNote == -1)
            return chord;

        var suffix = name.substr(Midi.notes[baseNote].length);

        chord.baseNote = true;

        for(var i = 0; i < noteCombinations.length; i++){
            var combination = noteCombinations[i];
            if(combination.name !== suffix)
                continue;

            for(var j = 0; j < combination.notes.length; j++){
                chord.tones[(combination.notes[j]+baseNote)%12] = true;
            }
        }

        return chord;
    }

    /** @brief returns a Chord from a fft data vector
    */
    var getChord = clazz.getChord = function(data){
        var midis = Midi.fromSpectrum(data);

        var chord = emptyChord();

        for(var i = 0; i < midis.length; i++){
            chord.tones[midis[i].pitch%12] = true;
        }

        return chord;
    }

    /** @brief returns a random chord
    */
    var random = clazz.random = function(){
        var baseNote = Math.floor(Math.random() * 12);

        var variant = noteCombinations[Math.floor(Math.random() * noteCombinations.length)];

        var chord = emptyChord();

        for(var i = 0; i < variant.notes.length; i++){
            chord.tones[(baseNote + variant.notes[i]) % 12] = true;
        }

        return chord;
    }

    /** @brief returns a Chord from multiple Midi instances
    */
    var fromMidi = clazz.fromMidi = function(midis){
        var newChord = emptyChord();

        for(var i = 0; i < midis.length; i++){
            newChord.tones[midis[i].pitch%12] = true;
        }

        return newChord;
    }

    /** @brief returns all possible chord names
     */
    var getResolvableChordNames = clazz.getResolvableChordNames = function(){
        var chordNames = {all:[]};

        for(var i = 0; i < Midi.notes.length; i++){
            chordNames[Midi.notes[i]] = [];
            for(var j = 0; j < noteCombinations.length; j++){
                chordNames.all.push(Midi.notes[i] + noteCombinations[j].name);
                chordNames[Midi.notes[i]].push(Midi.notes[i] + noteCombinations[j].name);
            }
        }

        return chordNames;
    }

    //================= PUBLIC METHODS ========================
    function toString(){
        for(var baseNote = 0; baseNote < 12; baseNote++){

            for(var i = 0; i < noteCombinations.length; i++){
                var combination = noteCombinations[i];

                var refNotes = Chord.emptyChord();

                for(var j = 0; j < combination.notes.length; j++){
                    refNotes.tones[(combination.notes[j]+baseNote)%12] = true;
                }

                if(this.equals(refNotes)){
                    return new Midi(baseNote).toString() + combination.name;
                }
            }

        }

        return "--";
    }

    /** @brief compares this Chord to another Chord
     *
     *  @return Object an object with the entries "missing" (the notes which
     *                 exist in this, but not in other)
     *                 "wrong" (the notes which exist in other, but not in this)
     */
    function compare(other){
        var missing = emptyChord().tones;
        var wrong = emptyChord().tones;
        var correct = true;
        for(var i = 0; i < this.tones.length; i++){
            if(this.tones[i] == other.tones[i])
                continue;

            correct = false;

            if(other.tones[i] == true){
                missing[i] = true;
            } else {
                wrong[i] = true;
            }
        }

        return {missing: missing, wrong: wrong};
    }

    /** @brief compares this Chord to another Chord
     *
     *  @return true if the chords are equal, false otherwise
     */
    function equals(other){
        if(this.tones.length != other.tones.length) return false;

        for(var i = 0; i < other.tones.length; i++){
            if(this.tones[i] != other.tones[i]) return false;
        }

        return true;
    }

    Chord.prototype.constructor = Chord;
    Chord.prototype.compare = compare;
    Chord.prototype.equals = equals;
    Chord.prototype.toString = toString;

    return Chord;

})();

window.Game = (function(){

    /** @brief the Game constructor
     *
     *  @param getUserMedia A function to retrieve the User media as documented in the Audio API
     */
    function Game(getUserMedia, rootElem){

        getUserMedia({audio: true},
            (function(self){
                return function(stream){
                    handleStream(self, stream);
                }
            })(this), handleRejection);

        //'class' variables
        this.analyser = null;
        this.currentTransition = null;
        this.currentChordTimeout = null;
        this.currentGameTimeout = null;

        this.currentChord = Chord.emptyChord();
        this.stableChord = null;
        this.currentChordStartTime = new Date().getTime();
        this.lastDetectedChord = Chord.emptyChord();

        this.rootElem = $(rootElem);
        this.liveFreqBins = $("#debug_liveFrequencyBins");
        this.runningFFT = $("#debug_runningFFT");

        //set callbacks
        (function(self){
            self.rootElem.find("#correct").on("click", function(){self.correctAnimation()});
            self.rootElem.find("#incorrect").on("click", function(){self.incorrectAnimation(Chord.random(), ["some", "thing"], ["else"])});
            self.rootElem.find("#trainingModeButton").on("click", function(){self.changePage("trainingMode")});
            self.rootElem.find("#challengeModeButton").on("click", function(){self.changePage("challengeMode")});
            self.rootElem.find("#aboutButton").on("click", function(){self.changePage("about")});
            self.rootElem.find("#settingsButton").on("click", function(){self.changePage("settings")});
            self.rootElem.find("#resetTrainingModeChordsButton").on("click", function(){
                self.resetTrainingModeChords();
                self.writeSettings();
                self.writeTrainingChords()
            });

            $(document).on("keydown", function(e){
                if(e.which == 39)// right arrow key
                    self.nextTone();
                if(e.which == 37)// left arrow key
                    self.prevTone();
            });
        })(this);


        this.writeSettings();
        this.writeTrainingChords();
    }

    var clazz = Game;

    //================= STATIC PRIVATE METHODS ========================
    /** @brief creates an audio context, connects the stream to an analyzer
    */
    function handleStream(self, stream){
        self.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        self.analyser = self.audioContext.createAnalyser();
        self.source = self.audioContext.createMediaStreamSource(stream);
        self.source.connect(self.analyser);

        self.resetAndStartGame();
    }

    /** @brief handles the user rejecting the media access
    */
    function handleRejection(){
        console.error("Could not aquire user media: ", arguments);
    }

    //================= PRIVATE METHODS ========================
    /** @brief extracts a stable (>200ms) chord from the data stream
     *  call this regularly and examine the resulting object
     *
     *  @param data a fft data vector
     *
     *  @return a stable chord if it was detected for longer than 200ms
     *          or null if no chord was detected or for shorter than 200ms
     */
    function findStableChord(self, data){
        var chord = Chord.getChord(data);

        if(!self.currentChord.equals(chord)){
            self.currentChord = chord;
            self.currentChordStartTime = new Date().getTime();

            return null;
        }

        var chordDuration = new Date().getTime() - self.currentChordStartTime;

        if(chordDuration < 200){
            return null;
        }

        if(self.currentChord.equals(Chord.emptyChord())){
            return null;
        }

        self.lastDetectedChord = chord;

        return chord;
    }

    function getCurrentPage(self){
        var curButtonId = self.rootElem.find(".currentMenuEntry").attr("id");
        return curButtonId.substr(0, curButtonId.length-"Button".length);
    }

    /** @brief normalizes a fft data vector, truncates frequencies <75 and >1000Hz
    */
    function normalizeData(self, data){
        var output = new Float32Array(data.length);

        var exp10 = Math.exp(10);
        var max_value = 0.0;
        var lowest_valid_bin = data.length;
        var highest_valid_bin = 0;
        for(var i = 0; i < data.length; i++){
            var freq = self.getFrequencyOfBin(i);
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

    /** @brief checks regularly if a stable chord has been detected
    *          if it has not been shown to the user yet, does so
    */
    function trainingMode(self){
        var currentlySearchedChord = Chord.fromName(getCurrentChordName(self));

        if(self.stableChord !== null &&
            self.currentChordStartTime !== self.lastAcknowledgedChordStartTime){

            if(currentlySearchedChord.equals(self.stableChord)){
                self.correctAnimation();
            }else{
                var result = currentlySearchedChord.compare(self.stableChord);
                self.incorrectAnimation(self.stableChord, result.missing, result.wrong);
            }

            self.lastAcknowledgedChordStartTime = self.currentChordStartTime;
        }

        self.currentGameTimeout = window.setTimeout(function(){trainingMode(self)}, 100);
    }

    /** @brief checks regularly if a stable chord has been detected
    *          if it has not been shown to the user yet, does so. if the chord
    *          was correct it jumps to the next one
    */
    function challengeMode(self){
        var currentlySearchedChord = Chord.fromName(getCurrentChordName(self));

        if(self.stableChord !== null &&
            self.currentChordStartTime !== self.lastAcknowledgedChordStartTime){

            if(currentlySearchedChord.equals(self.stableChord)){
                self.correctAnimation();
                self.nextTone();
            }else{
                var result = currentlySearchedChord.compare(self.stableChord);
                self.incorrectAnimation(self.stableChord, result.missing, result.wrong);
            }

            self.lastAcknowledgedChordStartTime = self.currentChordStartTime;
        }

        self.currentGameTimeout = window.setTimeout(function(){challengeMode(self)}, 100);
    }

    function getCurrentChordName(self){
        return self.rootElem.find(".visible .currentTone .displayedTone").eq(0).text();
    }

    //================= PUBLIC METHODS ========================
    /** @brief checks if a chord has been played over 200ms
     *  if a chord has been detected it is saved in this.stableChord
     *  runs asynchronously until stopFindingChord is called
     */
    function findChord(){
        if(this.analyser !== null){
            this.analyser.fftSize = 4096*4;
            this.analyser.smoothingTimeConstant = 0.8;
            var bufferLength = this.analyser.frequencyBinCount;

            var dataArrayF = new Float32Array(bufferLength);

            this.analyser.getFloatFrequencyData(dataArrayF);

            var data = normalizeData(this, dataArrayF);
            this.stableChord = findStableChord(this, data);
        }

        this.currentChordTimeout = window.setTimeout(function(self){
            return function(){self.findChord()}
        }(this), 50);
    }

    /** @brief stops the chord-finding-"thread"
     */
    function stopChordFinding(){
        if(this.currentChordTimeout !== null)
            window.clearTimeout(this.currentChordTimeout);
        this.currentChordTimeout = null;
    }

    /** @brief returns the frequency of a given fft bin according to the
      *        current fft-analyser settings
      */
    function getFrequencyOfBin(binNumber){
        var maxFreq = this.analyser.context.sampleRate / 2.0;
        var numBins = this.analyser.frequencyBinCount;
        return (binNumber / (numBins - 1.0)) * maxFreq;
    }

    //====================== PUBLIC ANIMATION METHODS ================

    function loadTrainingModeChords(){
        var chords = Cookies.getJSON("trainingModeChords");
        if(typeof chords === "undefined"){
            return ["A", "C", "D", "E", "G", "Am", "Em", "Dm"];
        }
        return chords;
    }

    function saveTrainingModeChords(chords){
        //TODO: this is shared between all instances
        Cookies.set("trainingModeChords", chords, {expires: 365});
    }

    function resetTrainingModeChords(){
        Cookies.remove("trainingModeChords");
    }

    function writeChords(chords, target){
        var dummy = $('<div class="singleToneDisplay"><span class="dummyTone"><span></span><span class="displayedTone" ></span></span>&nbsp;</div>');

        target.children().remove();
        for(var i=0; i<chords.length; i++){
            var newTone = dummy.clone();
            newTone.children().children().text(chords[i]);

            if(i==0)
                newTone.addClass("currentTone");
            else if(i==1)
                newTone.addClass("nextTone");
            else
                newTone.addClass("scrollRight scrollOut");

            target.append(newTone);
        }
    }

    function writeTrainingChords(){
        writeChords(this.loadTrainingModeChords(), this.rootElem.find("#trainingMode .tonesDisplay"));
    }

    function writeSettings(){
        var settingsDisplay = this.rootElem.find("#settingsDisplay");
        settingsDisplay.children().remove();

        var chords = Chord.getResolvableChordNames();
        var selectedChords = this.loadTrainingModeChords();

        for(var i=0; i<Midi.notes.length; i++){
            var line = "<tr><td class='chordName'>"+Midi.notes[i]+": </td>";

            for(var j=0; j<chords[Midi.notes[i]].length; j++){
                var chord = chords[Midi.notes[i]][j];
                line += "<td>"+chord+" <input type='checkbox' name='"+chord+"' ";
                if(selectedChords.indexOf(chord) !== -1){
                    line += "checked='checked' ";
                }
                line += "</td>";
            }

            line += "</tr>";

            settingsDisplay.append(line);
        }

        (function(self){
            settingsDisplay.find(":checkbox").on("change", function(){
                self.saveTrainingModeChords(settingsDisplay.find(":checkbox:checked").toArray().map(function(arg){return arg.name}));
                self.writeTrainingChords();
            });
        })(this);
    }

    function correctAnimation(){
        var tone = this.rootElem.find(".visible .currentTone .dummyTone").clone().appendTo(".currentTone");
        window.setTimeout(function(){tone.children(".displayedTone").addClass("tonePlayedCorrectly");}, 10);
        window.setTimeout(function(){tone.remove();}, 3000);
    }

    function incorrectAnimation(actual, missing, additional){
        var tone = this.rootElem.find(".visible .currentTone .dummyTone").clone().appendTo(this.rootElem.find(".currentTone"));

        var mElem = this.rootElem.find(".visible .missingTones");
        mElem.text("");

        var aElem = this.rootElem.find(".visible .additionalTones");
        aElem.text("");

        var pElem = this.rootElem.find(".visible .playedTone");
        pElem.text(actual.toString());

        if(typeof missing !== "undefined"){
            this.rootElem.find(".visible .explanationDisplay").css("visibility", "visible");
            for(var i=0; i<missing.length; i++){
                if(missing[i])
                    mElem.text(mElem.text() + " " + Midi.notes[i]);
            }
        }else{
            mElem.text("-");
        }

        if(typeof additional !== "undefined"){
            this.rootElem.find(".visible .explanationDisplay").css("visibility", "visible");
            for(var i=0; i<additional.length; i++){
                if(additional[i])
                    aElem.text(aElem.text() + " " + Midi.notes[i]);
            }
        }else{
            aElem.text("-");
        }

        window.setTimeout(function(){tone.children(".displayedTone").addClass("tonePlayedIncorrectly");}, 10);
        window.setTimeout(function(){tone.remove();}, 3000);
        this.currentExplanationTimeout = (function(self){
            if(self.currentExplanationTimeout){
                window.clearTimeout(self.currentExplanationTimeout);
            }
            return window.setTimeout(function(){
                self.rootElem.find(".visible .explanationDisplay").css("visibility", "hidden");
            }, 3000);
        })(this);
    }

    function nextTone(){
        if(this.rootElem.find(".visible .nextTone").size() === 0)
            return;
        this.rootElem.find(".visible .prevTone").removeClass("prevTone").addClass("scrollLeft scrollOut");
        this.rootElem.find(".visible .currentTone").removeClass("currentTone").addClass("prevTone");
        this.rootElem.find(".visible .nextTone").removeClass("scrollRight nextTone").addClass("currentTone");
        this.rootElem.find(".visible .currentTone").next().addClass("nextTone").removeClass("scrollOut");
    }

    function prevTone(){
        if(this.rootElem.find(".visible .prevTone").size() === 0)
            return;
        this.rootElem.find(".visible .nextTone").removeClass("nextTone").addClass("scrollRight scrollOut");
        this.rootElem.find(".visible .currentTone").removeClass("currentTone").addClass("nextTone");
        this.rootElem.find(".visible .prevTone").removeClass("scrollLeft prevTone").addClass("currentTone");
        this.rootElem.find(".visible .currentTone").prev().addClass("prevTone").removeClass("scrollOut");
    }

    function changePage(target){
        this.rootElem.find("#contentWindow .visible").removeClass("visible").addClass("hidden");
        this.rootElem.find(".currentMenuEntry").removeClass("currentMenuEntry");
        this.rootElem.find("#"+target+"Button").addClass("currentMenuEntry");
        window.clearTimeout(this.currentTransition);
        this.currentTransition =
        (function(self){
            return window.setTimeout(function(){
                self.rootElem.find("#"+target).removeClass("hidden").addClass("visible");
                self.resetAndStartGame();
            }, 600);
        })(this);
    }

    function resetAndStartGame(){
        if(this.currentGameTimeout !== null)
            window.clearTimeout(this.currentGameTimeout);

        var currentPage = getCurrentPage(this);

        if(currentPage === "trainingMode"){
            trainingMode(this);
        }else if(currentPage === "challengeMode"){
            var chords = [];
            var available = loadTrainingModeChords();
            for(var i=0; i<200; i++){
                chords.push(available[parseInt(Math.random()*available.length)])
            }
            this.writeChords(chords, $("#challengeMode .tonesDisplay"));
            challengeMode(this);
        }
    }


    Game.prototype.constructor = Game;
    Game.prototype.findChord = findChord;
    Game.prototype.stopChordFinding = stopChordFinding;
    Game.prototype.getFrequencyOfBin = getFrequencyOfBin;
    Game.prototype.resetAndStartGame = resetAndStartGame;

    Game.prototype.loadTrainingModeChords = loadTrainingModeChords;
    Game.prototype.saveTrainingModeChords = saveTrainingModeChords;
    Game.prototype.resetTrainingModeChords = resetTrainingModeChords;
    Game.prototype.writeChords = writeChords;
    Game.prototype.writeTrainingChords = writeTrainingChords;
    Game.prototype.writeSettings = writeSettings;
    Game.prototype.correctAnimation = correctAnimation;
    Game.prototype.incorrectAnimation = incorrectAnimation;
    Game.prototype.nextTone = nextTone;
    Game.prototype.prevTone = prevTone;
    Game.prototype.changePage = changePage;

    return Game;

})();