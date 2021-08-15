class RecorderInterface {
    recording = false;
    constructor(mediaStream, context){
        this.stream = mediaStream;
        this.recordedBuffer = [];
        this.context = context;
        this.setupStream(mediaStream);
        this.type == 'array';
    }
    record(clear=true) {
        if (clear) this.clear();
        this.recording = true;
        this.inRecord();
    }
    stop(callback = null) {
        this.recording = false;
        this.stopCb = callback;
        this.inStop();
    }
    clear() {
        this.recordedBuffer = [];
        this.recordedBlobs = [];
    }
    getBuffer() {
        //console.log(this.recordedBuffer);
        return {buffer: this.recordedBuffer, type: this.type};
    }
    isRecording() {
        return this.recording;
    }
    getContext() {
        return this.context;
    }

    testRecorder = (callback, testTime=500)=> {
        this.testing = true;
        this.record(true);
        setTimeout(()=>{
            this.stop((()=>{
                callback(this.recordedBuffer.length);
                this.testing = false;
            }).bind(this));
        }, testTime);
    }

    setupStream(stream) {}
    init() {}
    inRecord() {}
    inStop() {}
}

export function getRecorder(stream, context) {
    //WebKit??
    if(/iPad|iPhone|iPod/i.test(navigator.userAgent) ) {
        return new Recorder(stream, context);
    } else {
        return new mRecorder(stream, context);
    }
}

class mRecorder extends RecorderInterface{
    constructor(mediaStream, context){
        super(mediaStream, context);
        this.recordedBlobs = [];
        this.type = 'audioBuffer';
    }
    setupStream(stream) {
        this.mediaRecorder = new MediaRecorder(stream);
    }
    init() {
        this.mediaRecorder.ondataavailable = (function(e) {
            //console.log('onData');
            this.recordedBlobs.push(e.data);
        }).bind(this);
        this.mediaRecorder.onstop = (async (e) => {
            var blob = new Blob(this.recordedBlobs); //, {type:'audio/mp3'}
            let arraybuffer = await blob.arrayBuffer();
            this.context.decodeAudioData(arraybuffer, (function (audioBuffer) {
                this.recordedBuffer = audioBuffer;
                if (this.stopCb) this.stopCb();
            }).bind(this));
            
        }).bind(this);
    }
    inRecord() {
        //console.log('record!');
        this.mediaRecorder.start();
    }
    inStop() {
        //console.log('stop!');
        this.mediaRecorder.stop();
    }

    
    
}

class Recorder extends RecorderInterface {
   
    constructor(mediaStream, context) {
        super(mediaStream, context);
        this.type = 'array';
        
    }

    setupStream(ms) {
        this.source = this.context.createMediaStreamSource(ms);
    }

    init() {
        this.initProcessor();
        this.connectAll();
    }

    connectAll() {
        this.processor.connect(this.context.destination);
        this.source.connect(this.processor);
    }

    disconnectAll() {
        this.processor.disconnect(this.context.destination);
        this.source.disconnect(this.processor);
    }

    initProcessor() {
        this.processor = this.context.createScriptProcessor(1024,1,1);
        this.processor.onaudioprocess = (e) => {
            if (!this.recording) return;
            e.inputBuffer.getChannelData(0).forEach(e => {
                this.recordedBuffer.push(e);
            })
        };
    }

    inStop() {
        if (this.stopCb) this.stopCb();
    }
}

export class BufferPlayer {
    constructor(context, buffer=null) {
        this.context = context;
        this.buffer = buffer;
        this.gainNode = this.context.createGain();
        this.destination = this.context.destination;
        this.applyComposer();
        this.gainNode.connect(this.destination);
        this.loop = false;
    }

    playBuffer({buffer, type}, loop=false, fade={in:0, out:0}) {
        if (type == 'array') {
            this.newBuffer = this.context.createBuffer(1, buffer.length, this.context.sampleRate);
            this.newBuffer.getChannelData(0).set(buffer);
        } else {
            this.newBuffer = buffer;
        }
        this.play(loop, fade);
    }

    playBufferOri(buffer, loop=false, fade={in:0, out:0}) {
        this.buffer = buffer;
        this.play(loop, fade);
    }

    play(loop=this.loop, fade={in:0, out:0}) {
        this.loop = loop;
        let playSource = this.context.createBufferSource();
        this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
        playSource.loop = loop;
        playSource.buffer = this.newBuffer;
        playSource.connect(this.gainNode);
        playSource.start();
        playSource.onended = (function() {
            this.toStop();
            //console.log('onend!');
        }).bind(this);
        this.playSource = playSource;
    }

    applyPingPong(delay=0.15, feedback=0.25) {
        //console.log('applyPingPong!');
        let delayNode = this.context.createDelay();
        delayNode.delayTime.setValueAtTime(delay, this.context.currentTime);
        //this.gainNode.disconnect(this.connectTo);
        this.gainNode.connect(delayNode);
        delayNode.connect(this.destination);
        let fbGain = this.context.createGain();
        fbGain.gain.setValueAtTime(feedback, this.context.currentTime);
        delayNode.connect(fbGain);
        fbGain.connect(delayNode);
        this.delayNode = delayNode;
        this.fbGain = fbGain;
    }

    applyComposer() {
        let compressor = this.context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, this.context.currentTime);
        compressor.knee.setValueAtTime(40, this.context.currentTime);
        compressor.ratio.setValueAtTime(12, this.context.currentTime);
        compressor.attack.setValueAtTime(0, this.context.currentTime);
        compressor.release.setValueAtTime(0.25, this.context.currentTime);
        this.destination = compressor;
        compressor.connect(this.context.destination);
    }

    setPinPongDelay(v) {
        if (this.delayNode)
            this.delayNode.delayTime.setValueAtTime(v, this.context.currentTime+0.1);
    }

    setPinPongFeedback(v) {
        if (this.fbGain)
            this.fbGain.gain.setValueAtTime(v, this.context.currentTime+0.1);
    }

    setPlayGain(v) {
        this.gainNode.gain.setValueAtTime(v, this.context.currentTime);

    }

    setPlayRate(v) {
        if (this.playSource)
            this.playSource.playbackRate.value = v;
    }

    stop() {
        this.toStop();
    }

    toStop() {
        if (this.playSource) {
            this.playSource.disconnect(this.gainNode);
            this.playSource = null;
        }
    }
}