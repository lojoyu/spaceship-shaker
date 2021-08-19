import {importAll} from './ussage/ussage';
import {ShakerNoRec} from './mode/shakerNoRec';
import {onload} from './index';

import bird from './sounds/bird.wav';
import car from './sounds/car.wav';
import leaf from './sounds/leaf.wav';

export const images = importAll(require.context('./img/png', false, /\.(png|jpe?g|svg)$/));

export const names = ['a', 'b', 'c'];
export const videos = ["mPWEKlhxBeI", "X7WG4lZXrDs", "W0EupWkmxGI", "NEG4Fvjj6e4"];
export const hint = " We recommend use Safari (iOS), Chrome (Android).";

let debug = false;

export function initModeList() {

    let shaker_bird = new ShakerNoRec({
        instr: '用力搖搖手機<br>加入演出',
        onload:onload,
        soundFile: bird,
        enableMs: 300
    });
    let shaker_car = new ShakerNoRec({
        instr: '用力搖搖手機<br>加入演出',
        onload:onload,
        soundFile: car,
        enableMs: 300
    });
    let shaker_leaf = new ShakerNoRec({
        instr: '用力搖搖手機<br>加入演出',
        onload:onload,
        soundFile: leaf,
        enableMs: 300
    });
    
    return [shaker_bird, shaker_car, shaker_leaf, shaker_bird];
}

export function createBtn(id, src, txt) {
    // return `<div id=${id} class="square hidden">
    //     <div class="squarecontent">
    //         <img src="${src}"/>
    //         <div>${txt}</div>
    //     </div>
    // </div>`;
    let c = "";
    if (id == 'mode-0') c = 'squaresingle'
    return `<div id=${id} class="square hidden ${c}">
            <img class="squarecontent" src="${src}"/>
    </div>`;
}