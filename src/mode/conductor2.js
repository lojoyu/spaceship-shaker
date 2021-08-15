import {Mode} from './mode.js';
import {importAll, minmax, scale, json2Str, Avg} from '../ussage/ussage.js';
import {GrainPlayer, Transport, Gain, Player} from 'tone';
/***
 * 
 *  init=null,
    end=null,
    motion=null,
    onload
 */

// const list = ['bass', 'piano', 'sax', 'drum'];

var pathList = [
    importAll(require.context('../sounds/jazz/piano', false, /\.(m4a|mp3)$/)),
    importAll(require.context('../sounds/jazz/sax', false, /\.(m4a|mp3)$/)),
    importAll(require.context('../sounds/jazz/bass', false, /\.(m4a|mp3)$/)),
    importAll(require.context('../sounds/jazz/drum', false, /\.(m4a|mp3)$/))
];

export class Conductor extends Mode {
    constructor(config) { 
        super(config);
        if (!this.config.motion) this.config.motion = this.changeRate;
        this.loadNum = 0;
        this.avg = new Avg(20);
        this.count = 0;
    }

    inInit() {
        this.players = [];
        let i=0;
        pathList.forEach(path => {
            i++;
            this.players.push(new JazzPlayer(path, this.onload.bind(this), i<=3, i<=2));
        });

        Transport.scheduleRepeat((time) => {
            this.players.forEach(p=>{
                p.change();
            })
        }, "1n");
        
    }

    onload() {
        this.loadNum++;
        if (this.loadNum == pathList.length) {
            this.loaded = true;
            if (this.config.onload) this.config.onload();
        }
    }

    changeRate(v) {
        let fv = 0;
        let low = 50, mid = 90, high = 300;
        let tlow = 0.2, tmid = 0.8, thigh = 1.1, tfi = 3;
        let volume = 1;
        if (v < low) { // slow
            fv = scale(v, 0, low, tlow, tmid);
            volume = scale(v, 2, low, 0, 0.7);
        } else if (v < mid) { // normal
            volume = scale(v, low, (low+mid)/2, 0.7, 1);
            fv = scale(v, low, mid, tmid, thigh);
        } else { //fast
            fv = scale(v, mid, high, thigh, tfi);
        }
        fv = parseFloat(minmax(fv, tlow, tfi).toFixed(1));
        this.logHTML('biginstr', v + '</br>' + fv + '<br>' + json2Str(this.dm.orientVel));
        Transport.bpm.value = 120*fv;
        this.players.forEach(p=>{
            p.adjustVolume(volume);
            p.changeRate(fv);
        })
    }

    inMotion() {
        this.count += 1;
        let v = this.calcNorm(this.dm.orientVel);
        let av = this.avg.get(v);
        if (this.count > 10) {
            this.changeRate(av);
            this.count = 0;
        }
    }

    inEnd() {
        this.players.forEach(p=>{
            p.stop();
        })
        Transport.stop();
    }

    startEnable() {
        this.players.forEach(p=>{
            p.play();
        })
        Transport.start();
    }
}

class JazzPlayer {
    constructor(soundPath, onLoadCb = null, grain=false, empty=false) {
        this.soundPath = soundPath;
        this.players = [];
        this.gains = [];
        this.current = 0;
        this.loaded = 0;
        this.onloadCb = onLoadCb;
        this.playbackRate = 1;
        this.grain = grain;
        this.empty = empty;
        this.initPlayer(0);
        this.fade = "4n";
        this.multVolume = 1;
        this.volume = 0.25;
    }

    initOnePlayer(e) {
        let p;
        if (this.grain) {
            p = new GrainPlayer({
                url: e.default,
                loop: true,
                grainSize: 0.1,
                overlap: 0.05,
                onload: this.onload.bind(this)
            });
        } else {
            p = new Player(e.default, this.onload.bind(this));
            p.loop = true;
        }
        
        let gain = new Gain(0).toDestination();
        p.connect(gain);
        this.players.push(p);
        this.gains.push(gain);
    }

    initPlayer(ind) {
        this.initOnePlayer(this.soundPath[ind]);
    }

    onload() {
        this.loaded++;
        if (this.loaded == 1) {
        //if (this.loaded == this.soundPath.length) {
            if (this.onloadCb) this.onloadCb();
        }
        this.current = Math.floor(Math.random()*this.loaded);
        this.initPlayer(this.loaded);
    }

    isLoaded(ind) {
        return this.players[ind].loaded;
    }

    play(ind = this.current) {
        if (this.isLoaded(ind)) {
            this.players[ind].playbackRate = this.playbackRate;
            if(this.grain) this.players[ind].detune = -12*Math.log2(this.playbackRate);
            this.gains[ind].gain.rampTo(this.volume*this.multVolume, this.fade);
            this.players[ind].start();
            this.current = ind;
        }
    }

    stop(ind = this.current) {
        this.gains[ind].gain.rampTo(0, this.fade);
        this.players[ind].stop(this.fade);
    }

    adjustVolume(v) {
        this.multVolume = v;
        this.gains[this.current].gain.rampTo(this.volume*this.multVolume, "4n");
    }

    change() {
        if (Math.random() > 0.2) return;
        let r = Math.floor(Math.random()*this.loaded);
        if (this.current == r) return;
        this.stop();
        
        if (this.empty && Math.random() > 0.88) return;
        this.play(r);
    }

    changeRate(v) {
        this.playbackRate = v;
        this.players[this.current].playbackRate = v;
        if(this.grain) this.players[this.current].detune = -12*Math.log2(v);
    }
}
