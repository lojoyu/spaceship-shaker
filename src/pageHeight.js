window.addEventListener('resize', changeSize);

function changeSize() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    //console.log('vh', vh);
    //putSelector();
}
changeSize();

export function putSelector(){
    let vh = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
    let f = document.getElementById('footer').clientHeight;
    if (f == 0) return;
    let t = document.getElementById('title').clientHeight;
    // let st = document.getElementById('subtitle').clientHeight;
    let s = document.getElementById('selector').clientHeight;
    let margin = (vh - (t+s+f))/3 * 0.01;
    if (margin < 0) margin = 0;
    document.documentElement.style.setProperty('--sub', `${margin}px`);
}

