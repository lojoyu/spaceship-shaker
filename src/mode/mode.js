import {recStart, recEnd, recRestart} from '../ussage/recusage.js';
import {BufferPlayer} from '../recorder.js';
import {checkMicPermission, recorder} from '../mic';
export class Mode {    
    constructor(config={}) {
        this.fillConfig(config);
        this.enable = false;
        this.init();
        this.loaded = false;
    }

    fillConfig(config) {
        this.config = {
            init:null,
            end:null,
            motion:null,
            onload:null,
            instr: '',
            recordInstr: '',
            debug: false
        }
        this.config = {...this.config, ...config}
    }

    getInstr() {
        return this.config.instr;
    }

    getRecordInstr() {
        return this.config.recordInstr;
    }

    init() {
        this.inInit();
        //if (this.config.init) this.initFunc();
    }

    motion() {
        if (!this.enable) return;
        this.inMotion();
        //if (this.config.motion) this.config.motion(e);
    }

    end() {
        this.enable = false;
        this.inEnd();
    }

    setEnable(enable) {
        this.enable = enable;
        if (enable) {
            this.startEnable();
        }
        else this.end();
    }

    setDM(dm) {
        this.dm = dm;
        this.dm.listenerFunc = this.motion.bind(this);
    }

    log(txt, stop=false) {
        if (this.config.debug) {
            alert(txt);
            this.debug = !stop;
        }
    }

    logHTML(id, txt) {
        if (!this.config.debug) return;
        document.getElementById(id).innerHTML = txt;

    }

    //TODO: put in dm
    calcNorm(o) {
        return Math.pow(o.pitch * o.pitch + o.roll * o.roll + o.yaw * o.yaw, 1/3);
    }

    calcAvg(o) {
        return (o.pitch + o.roll + o.yaw)/3;
    }

    pause() {
        this.setEnable(false);
    }
    resume() {
        console.log('set resume?');
        this.setEnable(true);
    }

    inEnd(){}
    inInit(){}
    inMotion(){}
    startEnable(){}
    enableSound(){}
}

export class RecordMode extends Mode {
    constructor(config = {}) {
        super(config);
        this.recording = false;
        this.loaded = true;
        this.recorder = null;
        this.playing = false;
        this.needRec = true;
    }
    setProgressBar(pb) {
        this.progressBar = pb;
    }
    setRecorder(recorder) {
        //console.log('set recorder', recorder);
        this.recorder = recorder;
        this.bufferPlayer = new BufferPlayer(this.recorder.getContext());
    }
    getRecordLen() {
        return this.config.recordTime;
    }
    restart() {
        recRestart();
        this.playing = false;
        this.bufferPlayer.stop();
    }
    record() {
        this.recording = true;
        recStart();
        //console.log('record', this.recorder);
        
        this.progressBar.animate(0, {duration: 0}, (()=>{
            this.progressBar.animate(1.0, {duration: this.config.recordTime}, this.stopRecord.bind(this));
        }).bind(this));
        this.recorder.record(true);
    }
    stopRecord(go=true) {
        if (this.recording) {
            recEnd();
            this.recording = false;
            this.progressBar.stop();
            //this.recorder.stop();
            if (go) this.recorder.stop(this.afterStop.bind(this));
            else this.recorder.stop();
        }
    }
    playRecord() {
        this.recorder.play();
    }

    inEnd() {
        this.stopRecord(false);
        this.playing = false;
    }

    trimBuffer(buffer, threshold=0.01) {
        let i=0;
        for(i=0; i<buffer.length; i++) {
            if (Math.abs(buffer[i]) > threshold) break;
        }
        if (buffer.length - i < 1000) this.buffer = buffer;
        else this.buffer = buffer.slice(i);
    }

    pause() {
        this.prevPlaying = this.playing;
        if (!this.playing) {
            this.stopRecord(false);
            recRestart();
        }
        this.bufferPlayer.stop();
        this.playing = false;
    }
    resume() {
        //this.recorder.
        this.playing = this.prevPlaying;
        if (this.playing) {
            this.bufferPlayer.play();
        }
        checkMicPermission().then((()=>{
            console.log(recorder);
            this.recorder = recorder;
        }).bind(this));
        
        // if (this.recorder.disconnectAll) {
        //     this.recorder.disconnectAll();
        //     this.recorder.init();
        // }
    }
}