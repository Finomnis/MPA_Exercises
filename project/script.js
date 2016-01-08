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
        this.rootElem = $(rootElem);
        this.liveFreqBins = $("#debug_liveFrequencyBins");
        this.runningFFT = $("#debug_runningFFT");

        //set callbacks
        (function(self){
            self.rootElem.find("#correct").on("click", function(){self.correctAnimation()});
            self.rootElem.find("#incorrect").on("click", function(){self.incorrectAnimation(["a", "e"])});
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


        this.reset();
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
    function getStableChord(self, data){
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

        if(self.lastDeliveredChord.equals(self.currentChord)){
            return null;
        }

        self.lastDeliveredChord = chord;

        return chord;
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

    //================= PUBLIC METHODS ========================
    /** @brief resets the chord detection data
    */
    function reset(){
        this.currentChord = Chord.emptyChord();
        this.currentChordStartTime = new Date().getTime();
        this.lastDeliveredChord = Chord.emptyChord();
    }


    /** @brief checks if a given chord has been played over 200ms
     *  call this regularly (about every 50ms or so) to check for the chord
     *  and examine the result.
     *
     *  @param refChord a Chord instance to look for
     *
     *  @return an object with this layout:
     *          {found: true/false, //whether an accord was found at all
     *           correct: true/fasle, //whether the detected chord matches refChord
     *           missing: list, //a list of missing tones if a chord was found
     *           wrong: list} //a list of wrong tones if a chord was found
     */
    function findChord(refChord){
        if(this.analyser == null)
            return {found: false}
        this.analyser.fftSize = 4096*4;
        this.analyser.smoothingTimeConstant = 0.8;
        var bufferLength = this.analyser.frequencyBinCount;

        var dataArrayF = new Float32Array(bufferLength);

        this.analyser.getFloatFrequencyData(dataArrayF);

        var data = normalizeData(this, dataArrayF);
        var stableChord = getStableChord(this, data);

        if(stableChord == null){
            return {found: false };
        }

        var comparison = refChord.compare(stableChord);
        var result = refChord.equals(stableChord);
        return { found: true, correct: result, missing: comparison.missing, wrong: comparison.wrong };
    }

    function findChordContinous(refChord, interval, callback){
        var result = this.findChord(refChord);
        if(result.found === true){
            callback(result);
            this.reset();
        }else{
            window.setTimeout(function(self){
                return function(){self.findChordContinous(refChord, interval, callback)}
            }(this), interval);
        }
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
                newTone.attr("id", "currentTone");
            else if(i==1)
                newTone.attr("id", "nextTone");
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
        var tone = this.rootElem.find("#currentTone .dummyTone").clone().removeAttr("id").appendTo("#currentTone");
        window.setTimeout(function(){tone.children(".displayedTone").addClass("tonePlayedCorrectly");}, 10);
        window.setTimeout(function(){tone.remove();}, 3000);
    }

    function incorrectAnimation(missing, additional){
        var tone = this.rootElem.find("#currentTone .dummyTone").clone().removeAttr("id").appendTo(this.rootElem.find("#currentTone"));

        var mElem = this.rootElem.find("#missingTones");
        mElem.text("");

        var aElem = this.rootElem.find("#additionalTones");
        aElem.text("");

        if(typeof missing !== "undefined"){
            this.rootElem.find("#explanationDisplay").css("visibility", "visible");
            for(var i=0; i<missing.length; i++){
                mElem.text(mElem.text() + " " + missing[i]);
            }
        }else{
            mElem.text("-");
        }

        if(typeof additional !== "undefined"){
            this.rootElem.find("#explanationDisplay").css("visibility", "visible");
            for(var i=0; i<additional.length; i++){
                aElem.text(aElem.text() + " " + additional[i]);
            }
        }else{
            aElem.text("-");
        }

        window.setTimeout(function(){tone.children(".displayedTone").addClass("tonePlayedIncorrectly");}, 10);
        (function(self){window.setTimeout(function(){
            tone.remove();
            /*this hides too early if two animations started within 3s*/
            self.rootElem.find("#explanationDisplay").css("visibility", "hidden");
        }, 3000);})(this);
    }

    function nextTone(){
        if(this.rootElem.find("#nextTone").size() === 0)
            return;
        this.rootElem.find("#prevTone").removeAttr("id").addClass("scrollLeft scrollOut");
        this.rootElem.find("#currentTone").attr("id", "prevTone");
        this.rootElem.find("#nextTone").attr("id", "currentTone").removeClass("scrollRight");
        this.rootElem.find("#currentTone").next().attr("id", "nextTone").removeClass("scrollOut");
    }

    function prevTone(){
        if(this.rootElem.find("#prevTone").size() === 0)
            return;
        this.rootElem.find("#nextTone").removeAttr("id").addClass("scrollRight scrollOut");
        this.rootElem.find("#currentTone").attr("id", "nextTone");
        this.rootElem.find("#prevTone").attr("id", "currentTone").removeClass("scrollLeft");;
        this.rootElem.find("#currentTone").prev().attr("id", "prevTone").removeClass("scrollOut");
    }

    function changePage(target){
        this.rootElem.find("#contentWindow .visible").removeClass("visible").addClass("hidden");
        this.rootElem.find(".currentMenuEntry").removeClass("currentMenuEntry");
        this.rootElem.find("#"+target+"Button").addClass("currentMenuEntry");
        window.clearTimeout(this.currentTransition);
        this.currentTransition =
        (function(self){return window.setTimeout(function(){
            self.rootElem.find("#"+target).removeClass("hidden").addClass("visible");}, 600);
        })(this);
    }


    Game.prototype.constructor = Game;
    Game.prototype.findChord = findChord;
    Game.prototype.findChordContinous = findChordContinous;
    Game.prototype.reset = reset;
    Game.prototype.getFrequencyOfBin = getFrequencyOfBin;

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

var currentChordGameTarget = false;
var feedbackText = "<BR><BR><BR>";
function updateChordGame(data){

    if(currentChordGameTarget == false){
            currentChordGameTarget = Chord.random();
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
            currentChordGameTarget = Chord.random();
            resetFindChord();
        }
    }


    document.getElementById('chordgame_text').innerHTML = "Please play: " + currentChordGameTarget.name + "<BR>";
}

