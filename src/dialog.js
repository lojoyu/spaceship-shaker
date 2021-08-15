import vexcss from './lib/vex/css/vex.css';
import vexthemecss from './lib/vex/css/vex-theme-wireframe.css';
import vex from './lib/vex/js/vex.combined';

var headID = document.getElementsByTagName('head')[0];
var link = document.createElement('link');
link.rel = 'stylesheet';
link.href = vexcss;
var link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = vexthemecss;
headID.appendChild(link);
headID.appendChild(link2);


vex.defaultOptions.className = 'vex-theme-wireframe';

function showDialog(msg, callback=()=>{}, okbtn='OK') {
    vex.dialog.buttons.YES.text = okbtn
    vex.dialog.alert({
        message: msg,
        callback: callback
    })
}

export {showDialog};



