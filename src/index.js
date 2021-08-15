import $ from 'jquery';
import './lightbox.css';
import './style.css';
import './pageHeight';
import {checkPC} from'./checkPC';
import {putSelector} from'./pageHeight';
import viewStep from '@zonesoundcreative/view-step';
import {recRestart, showInstrOnly} from './ussage/recusage.js';
import {progressbar} from './rec.js';
import {show, hide} from './ussage/cssusage';
import arrow from './img/arrow.png';
import {dm} from './device';
import * as Tone from 'tone';
import {checkMicPermission, recorder, micPermission} from './mic.js';
import {showDialog} from './dialog';
import './ytplayer';
import {images, names, videos, hint, initModeList, createBtn} from './const';
import './orientation.css';

var loading = false;
var viewstep = new viewStep('.step', 1, 2, {
    2: checkLoad,
    3: selectMode
});
var mode = -1;
export var nowMode = null;
export var nowVideo = "";
var modeList;
if (checkPC()) {
    initPage();
}
function initPage() {
    
    $('#previmg').attr("src", arrow);
    for (let i in images) {
        //images[i].default is file path
        $('#selector').append(createBtn(`mode-${i}`, images[i].default, names[i]));
        // button onclick
        $('#mode-'+i).click(function() {

            Tone.context.resume();
            mode = i;
            nowMode = modeList[i];
            nowVideo = videos[i];
            // change to await
            dm.requestPermission().then(()=>{
                if (dm.granted) {
                    viewstep.showNext(true, true, 2);
                } else {
                    //viewstep.showNext(true, true, 2);
                    showDialog('For the full experience, please accept orientation permission.'+hint);
                }
            });
        });
    }
    // $('#start').on('click', function() {
    //     Tone.context.resume();
    //     mode = 0;
    //     nowMode = modeList[0];
    //     // change to await
    //     dm.requestPermission().then(()=>{
    //         if (dm.granted) {
    //             viewstep.showNext(true, true, 2);
    //         } else {
    //             //viewstep.showNext(true, true, 2);
    //             showDialog('For the full experience, please accept orientation permission.'+hint);
    //         }
    //     });
    // });
    //$('.lightbox').removeClass('hidden');
    modeList = initModeList();

    Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => {img.onload = img.onerror = resolve; }))).then(() => {
        $('#selector div').removeClass('hidden');
        $('#subtitle').removeClass('hidden');
        $('.lightbox').removeClass('hidden');

        putSelector();
        
    });
}

export function onload() {
    console.log("load~");
    if (loading) checkLoad();
}



$("#previmg").on('click', function() {
    viewstep.showPrev();
    viewstep.showPrev();
    nowMode.setEnable(false);
    mode = -1;
    nowMode = null;
});

function selectMode () {
    //console.log('select mode:', mode);
    $("#biginstr").text(nowMode.getInstr());
    $("#recinstr").text(nowMode.getRecordInstr());
    nowMode.setDM(dm); //only one time?
    nowMode.setEnable(true);
    if (nowMode.needRec) {
        show('.recorduse');
        recRestart();
        nowMode.setProgressBar(progressbar); //one time?
    } else {
        hide('.recorduse');
        showInstrOnly();
    }
}

function checkLoad() {
    //alert(`${mode} ${modeList[mode].loaded}`);
    loading = true;
    if (modeList[mode].loaded){ 
        loading = false;
        if (modeList[mode].needRec) {
            checkMicPermission().then(()=>{
                if (micPermission) {
                    nowMode.setRecorder(recorder);
                    viewstep.showNext(true, true, 3);
                } else {
                    viewstep.showPrev();
                }
            })
        } else {
            viewstep.showNext(true, true, 3);
        }   
    }
}