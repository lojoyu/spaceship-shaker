import {getRecorder} from './recorder';
import {showDialog} from './dialog';
import {hint} from './const';

var recorder;
const AudioContext = window.AudioContext|| window.webkitAudioContext ||      window.mozAudioContext || window.msAudioContext;
const context = new AudioContext();
var mediaStream, source;
var micPermission = false;
var testMic = false;
var testTime = 500;
var testFinish = false;

let olderBrowser = function() {
    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }
  
    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
    
        // First get ahold of the legacy getUserMedia, if present
        var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }
    
        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
        });
        }
    }
    
}

let grantMicPermission = async () => {
    olderBrowser();
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true}); 
    } catch(err) {
        //handle hint page here
        showDialog('To record samples, please turn on microphone.'+hint);
        //console.error(err);
        return false;
    }
    initRecord();
    while(!testFinish) await wait(testTime);
    return testMic && true;
}

let checkMicPermission = async () => {
    //if (!micPermission) {
    micPermission = await grantMicPermission();
    //}
}

let initRecord = function() {
    recorder = getRecorder(mediaStream, context);
    recorder.init();
    recorder.testRecorder((len)=>{
        if (len != 0) {
            testMic = true;
        } else {
            showDialog('There seems to be an issue with the microphone, please reload the page.');
            testMic = false; 
        }
        testFinish = true;
    }, testTime);
};

let testRecorder = ()=> {
    recorder.record(true);
    setTimeout(()=>{
        recorder.stop(()=>{
            let buffer = recorder.getBuffer();
            if (buffer.length != 0) {
                testMic = true;
            } else {
                showDialog('There seems to be an issue with the microphone, please reload the page.');
                testMic = false;
            }
            testFinish = true;
        });
        
    }, testTime);
}

async function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
}

export {checkMicPermission, recorder, micPermission, testMic};