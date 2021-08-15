import {Mode} from './mode.js';
import {importAll, minmax, scale, json2Str, Avg} from './ussage';
import {Player, Transport, PitchShift} from 'tone';
/***
 * 
 *  init=null,
    end=null,
    motion=null,
    onload
 */

const list = ['bass', 'piano', 'sax', 'drum'];

var pathList = [
    importAll(require.context('./sounds/jazz/piano', false, /\.(m4a|mp3)$/)),
    importAll(require.context('./sounds/jazz/sax', false, /\.(m4a|mp3)$/)),
    importAll(require.context('./sounds/jazz/bass', false, /\.(m4a|mp3)$/)),
    importAll(require.context('./sounds/jazz/drum', false, /\.(m4a|mp3)$/))
];

export class Conductor extends Mode {
    constructor(config) { 
        super(config);
        if (!this.config.motion) this.config.motion = this.changeRate;
        this.loaded = 0;
        this.avg = new Avg(50);
        
    }

    inInit() {
        this.players = [];
        //console.log(pathList);
        let i=0;
        pathList.forEach(path => {
            i++;
            //console.log(path, i<=2);
            this.players.push(new JazzPlayer(path, false, this.onload.bind(this)));
        });

        Transport.scheduleRepeat((time) => {
            this.players.forEach(p=>{
                p.change();
            })
        }, "1n");
        
    }

    onload() {
        this.loaded++;
        if (this.loaded == 4) {
            if (this.config.onload) this.config.onload();
        }
    }

    changeRate(v) {
        //console.log('change'); 
        let fv = 0;
        let low = 15, mid = 80, high = 200;
        let tlow = 0.4, tmid = 0.8, thigh = 1.1, tfi = 1.5;
        if (v < low) { // slow
            fv = scale(v, 0, low, tlow, tmid);
        } else if (v < mid) { // normal
            fv = scale(v, low, mid, tmid, thigh);
        } else { //fast
            fv = scale(v, mid, high, thigh, tfi);
        }
        fv = parseFloat(minmax(fv, tlow, tfi).toFixed(1));
        this.logHTML('biginstr', fv + '</br>' + minmax(fv, tlow, tfi) + '<br>' + json2Str(this.dm.orientVel));
        Transport.bpm.value = 120*fv;
        this.players.forEach(p=>{
            p.changeRate(fv);
        })
    }

    inMotion() {
        let v = this.calcAvg(this.dm.orientVel);
        let av = this.avg.get(v);
        //document.getElementById('biginstr').innerHTML = toString(this.dm.orientVel);
        this.changeRate(av);
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
        // Transport.bpm.value = 120*0.6;
        // this.players.forEach(p=>{
        //     p.changeRate(0.6);
        // })
    }
}

class JazzPlayer {
    constructor(soundPath, shift=true, onLoadCb = null) {
        this.soundPath = soundPath;
        this.players = [];
        this.shift = shift;
        this.shifts = [];
        this.current = 0;
        this.loaded = 0;
        this.onloadCb = onLoadCb;
        this.playbackRate = 1;
        this.initPlayer();
    }

    initPlayer() {
        this.soundPath.forEach(e => {
            let p = new Player(e.default, this.onload.bind(this));
            p.loop = true;
            p.fadeIn = "4n";
            p.fadeOut = "4n";

            if (this.shift) {
                let shift = new PitchShift(0).toDestination();
                shift.set({windowSize: 0.03});
                p.connect(shift);
                this.shifts.push(shift);
            } else {
                p = p.toDestination();
            }
            this.players.push(p);
        });
    }

    onload() {
        this.loaded ++;
        if (this.loaded == this.soundPath.length) {
            if (this.onloadCb) this.onloadCb();
        }
    }

    play(ind = this.current) {
        if (this.players[ind].loaded) {
            this.players[ind].playbackRate = this.playbackRate;
            if (this.shift) this.shifts[ind].pitch = -12*Math.log2(this.playbackRate);
            this.players[ind].start();
            this.current = ind;
            setTimeout(()=>{this.changeRate(1.5);}, 5000);
            setTimeout(()=>{this.changeRate(0.5);}, 50000);
        }
    }

    stop() {
        this.players[this.current].stop();
    }

    change() {
        if (Math.random() > 0.1) return;

        let r = Math.floor(Math.random()*this.players.length);
        this.players[this.current].stop();      
        this.play(r);
    }

    changeRate(v) {
        this.playbackRate = v;
        this.players[this.current].playbackRate = v;
        //console.log('rate', v, -12*Math.log2(1/v));
        if (this.shift) this.shifts[this.current].pitch = -12*Math.log2(v);
    }
}
