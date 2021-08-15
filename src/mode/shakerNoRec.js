import {Mode} from './mode.js';
import {Avg, json2Str, minmax} from '../ussage/ussage.js';
import {PingPongDelay} from 'tone';
import * as Tone from 'tone';
import water from '../sounds/water.m4a';
//import water from '../sounds/forest1.mp3';
export class ShakerNoRec extends Mode {
    
    constructor(config) {
        
        super(config);
        console.log("shaker init", this.config);
        //if(!this.config.recordTime) this.config.recordTime = 2500;
        this.enablePlay = true;
        this.avg = new Avg(30);
        this.enableMs = 2000;
    }
    
    inInit() {
        
        this.sound = new Tone.Player(water, this.onload.bind(this)).toDestination();
        console.log(this.sound);
    }

    onload() {
        console.log("load!");
        this.loaded = true;
        if (this.config.onload) this.config.onload();
    }

    startEnable() {
        // if (this.sound.loaded) {
        //     this.sound.start("+0");
        // }
        this.playing = true;
    }

    inEnd() {
        this.sound.stop();
        this.playing = false;
    }

    afterStop() {
        let buffer = this.recorder.getBuffer();
        this.trimBuffer(buffer.buffer);
        this.buffertype = buffer.type;
        this.bufferPlayer.applyPingPong();
        this.playing = true;
    }

    inMotion() {
        if (!this.playing) return;
        //console.log('in!', this.dm);
        let a = minmax(this.dm.orientAcc.yaw, -100000, 100000);
        let aa = this.avg.get(a);
        this.playWhenAcc(a, aa);
    }

    playWhenAcc(a, aa) {
        this.logHTML('biginstr', a.toFixed(0) + '<br>' + aa.toFixed(0) + '<br>' + json2Str(this.dm.orientAcc));
        //if ((a > 0 && aa < 0) || (a < 0 && aa > 0)) return;
        // if ( Math.abs(a) > Math.abs(aa) * 50 && Math.abs(a) > 3500) {
        //     //this.playImmediately();
        // } else 
        if (a > 6000 && aa < 0 || a < -10000 && aa > 0 || Math.abs(a) > Math.abs(aa) * 1000) {
            console.log(a, aa, 'play!');
            this.playImmediately();
        }
    }
     
    playImmediately() {
        if (!this.enablePlay) return;
        this.enablePlay = false;
        this.sound.start("+0");
        //this.bufferPlayer.playBuffer({buffer: this.buffer, type:this.buffertype});
        //this.bufferPlayer.playBuffer(this.buffer);
        setTimeout((()=>{
            this.enablePlay = true;
        }).bind(this), this.enableMs);
    }
    
}