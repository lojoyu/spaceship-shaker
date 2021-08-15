import {Mode} from './mode.js';
import {minmax, scale, json2Str, Avg, random, drunk, randomMore} from '../ussage/ussage.js';
import * as Tone from 'tone';
import forest from '../sounds/forest1.mp3';

export class Balance extends Mode{
    constructor(config) {
        super(config);
        //if (!this.config.motion) this.config.motion = this.changeRate;
    }

    inInit() {
        this.forest = new Tone.Player(forest, this.onload.bind(this)).toDestination();
        this.forest.loop = true;
        this.forest.fadeIn = 10;
        this.vAvg = new Avg(20);
        this.noise = new Noise();
        this.forest.volume.value = -60;

    }

    onload() {
        // console.log('forest onload');
        this.loaded = true;
        if (this.config.onload) this.config.onload();
    }

    adjustVolume(v) {
        let fv = scale(v, 2, 90, 0, 1);
        fv = minmax(fv, 0, 1);
        this.logHTML('biginstr', fv + '<br>' + v + '<br>' + json2Str(this.dm.orientVel));
        this.forest.volume.rampTo(fv*(-45)+5, 1);
        this.noise.setVolume(fv < 0.05 ? 0 : fv*0.45, 0);
    }

    startEnable() {
        if (this.forest.loaded) {
            this.forest.volume.rampTo(0, 1);
            this.forest.start("+0");
            this.noise.start();
        }
    }

    inEnd() {
        this.forest.stop();
        this.noise.stop();
    }

    inMotion() {
        let norm = this.calcNorm(this.dm.orientVel);
        let normavg = this.vAvg.get(norm);
        this.adjustVolume(normavg);
    }

    

}

class Noise {
    constructor() {
        this.init();
        this.initPreset();
    }

    init() {
        this.noise = new Tone.Noise("white").start();
        this.mult = new Tone.Multiply();
        this.multfactor = new Tone.Signal(2000);
        this.noise.connect(this.mult);
        this.multfactor.connect(this.mult.factor);
        
        this.drunksig = new Tone.Signal(300);
        this.add = new Tone.Add(300);
        this.mult.connect(this.add.addend);
        this.drunksig.connect(this.add);

        this.osc = new Tone.Oscillator(440, "sine").start();
        this.add.connect(this.osc.frequency);

        this.crusher = new Tone.BitCrusher(4);
        this.osc.connect(this.crusher);

        this.filter = new Tone.Filter(5000, "highpass");
        this.crusher.connect(this.filter);

        this.sub = new Tone.Subtract();
        this.crusher.connect(this.sub);
        this.filter.connect(this.sub.subtrahend);
        
        //delay;
        this.PingPongDelay = new Tone.PingPongDelay(0.1, 0.5);
        this.gain = new Tone.Gain(0).toDestination();
        this.sub.connect(this.PingPongDelay);
        this.PingPongDelay.connect(this.gain);
    }
    
    initPreset() {
        this.preset = {
            drunk: [15, 30, 60, 0, 0],
            crusher: [1, 2, 4, 8, 16],
            multfactor: [100, 50, 29, 1500, 3000],
            filter: [5000, 2000, 9000, 12000, 7000]
        }
        // let size = 5;
        // this.preset = {
        //     drunk: this.getRandomArray(size, 10, 200, (e)=>{return e > 100 ? 0 : e}),
        //     crusher: this.getRandomArray(size, 1, 16),
        //     multfactor: this.getRandomArray(size, 20, 3000),
        //     filter: this.getRandomArray(size, 2000, 12000)
        // };
    }

    getRandomArray(size, min, max, filter=(e=>{return e;})) {
        let arr = [];
        for (let i=0; i<size; i++) {
            arr.push(filter(random(min, max)));
        }
        return arr;
    }

    start(){
        this.gain.gain.value = 0;
        this.prevV = 0;
    }

    stop(){
        this.gain.gain.value = 0;
    }

    setVolume(v, time=0) {
        if (v != 0) {
            if (this.drinking) this.drunksig.value = drunk(this.drunksig.value, 20, 100, 700);
            if (Math.abs(this.prevV - v)>0.08) this.change();
        }
        //this.gain.gain.rampTo(v, time);
        this.gain.gain.value = v;
        this.prevV = v;
    }

    change() {
        
        let r = random(0, 5);
        if (this.preset.drunk[r]) {
            this.drunksig.value = this.preset.drunk[r];
            this.drinking = false;
        }
        else this.drinking = true;
        //this.filter.frequency = randomMore(this.filter.frequency, 1000, 1000, 15000);
        //this.crusher.bits = randomMore(this.crusher.bits, 4, 1, 16);
        this.crusher.bits = this.preset.crusher[r];
        this.multfactor.value = this.preset.multfactor[r];
        //this.filter.frequency = this.preset.frequency[r];
    }

}
