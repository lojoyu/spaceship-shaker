import $ from 'jquery';
import ProgressBar from 'progressbar.js';
import {nowMode} from './index.js';

export var progressbar = new ProgressBar.Circle('#recprogress', {
    strokeWidth: 3,
    easing: 'linear',
    duration: 3000,
    color: 'grey',
    trailColor: 'black',
    trailWidth: 3,
    text: {autoStyleContainer: false},
    svgStyle: null,
    step: function(state, circle) {
        if (this) {
            let time = circle.value()*this.duration;
            let min = Math.floor(time/60000);
            let sec = ((time%60000)/1000.).toFixed(2);
            $("#time").text(`${fillzero(min)}:${fillzero(sec)}`);
        }
    }
});
//console.log('progressbar init', progressbar);

$("#rec").on('click', ()=>{
    nowMode.record();
});

$("#rerec").on('click', ()=>{
    nowMode.restart();
});

$("#recprogress").on('click', stopRecord);
function stopRecord() {
    nowMode.stopRecord();
}

function fillzero(num) {
    return num >= 10 ? num : `0${num}`;
}