import {RecordMode} from './mode.js';
import {json2Str, minmax, scale, Avg} from '../ussage/ussage.js';

export class Gyro extends RecordMode {
    
    constructor(config) {
        super(config);
        if(!this.config.recordTime) this.config.recordTime = 50000;
        this.enablePlay = true;
        this.move = new Move(
            {min: 0.1, max: 1},
            {min: 0.1, max: 2},
            {x: 0.01, y: 0.01}
        );
        this.vxAvg = new Avg(20);
        this.vyAvg = new Avg(20);
    }

    afterStop() {
        console.log('after stop!', this.recorder.getBuffer().buffer);
        this.bufferPlayer.applyPingPong();
        this.bufferPlayer.playBuffer(this.recorder.getBuffer(), true, {in:2, out:1});
        this.playing = true;
    }

    inEnd() {
        this.stopRecord(false);
        this.playing = false;
        this.bufferPlayer.stop();
    }

    inMotion() {
        if (!this.playing) return;
        let xy = this.move.move(this.dm.orient.roll, this.dm.orient.pitch);
        //console.log('playgain'+xy.x);
        this.bufferPlayer.setPlayGain(xy.x);
        this.bufferPlayer.setPlayRate(xy.y);
        let vxavg = this.vxAvg.get(this.dm.orientVel.roll);
        let vyavg = this.vxAvg.get(this.dm.orientVel.pitch);
        let vx = minmax(scale(Math.abs(vxavg), 2, 80, 0.1, 1), 0.1, 1);
        let vy = minmax(scale(Math.abs(vyavg), 2, 80, 0.1, 0.5), 0.1, 0.8);
        this.bufferPlayer.setPinPongDelay(vx);
        this.bufferPlayer.setPinPongFeedback(vy);
        this.logHTML('biginstr', `${vx}<br>${vy}<br>${json2Str(this.dm.orientVel)}`);

        //console.log('in!', this.dm);
        // let a = minmax(this.dm.orientAcc.yaw, -100000, 100000);
        // let aa = this.avg.get(a);
        // this.playWhenAcc(a, aa);
    }

    
}

class Move {
    constructor(limx, limy, mult) {
        this.x = (limx.min+limx.max)/2;
        this.y = (limy.min+limy.max)/2;
        this.limx = limx;
        this.limy = limy;
        this.mult = mult;
    }

    move(x, y) {
        this.x += Math.sin(this.radians(x))*this.mult.x;
        this.x = minmax(this.x, this.limx.min, this.limx.max);

        this.y += Math.sin(this.radians(y))*this.mult.y;
        this.y = minmax(this.y, this.limy.min, this.limy.max);
        return {x: this.x, y: this.y};
    }

    radians(degrees){
        var pi = Math.PI;
        return degrees * (pi/180);
    }   

}