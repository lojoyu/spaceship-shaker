import {showDialog} from './dialog';
export function checkPC() {
    if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        // is mobile..
    } else { //|iPad
        // showDialog("This website is only available for mobile devices. You will be redirect to introduction page.", ()=>{
        //     window.location.href = "https://hertzianplayground.art";
        // });
        // return false;
    }
    return true;
}
