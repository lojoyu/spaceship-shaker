import $ from 'jquery';
import {nowVideo, nowMode} from './index';
initPlayer();
var player;
let videoIdNow;
function initPlayer() {

  $("#helpimg").on("click", function () {
    //console.log('click '+nowVideo);
    if (nowVideo == "") return;
    videoIdNow = nowVideo;
    iframeAPIReady();
  });

  function iframeAPIReady() {
    player = new YT.Player("player", {
      videoId: videoIdNow,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  }

  function onPlayerReady(event) {
    if (nowMode) nowMode.pause();
    event.target.playVideo();
    $(".js-lightbox").addClass("active");
  }

  function onPlayerStateChange(event) {
    if (player.getPlayerState() === 0) {
      player.destroy();
      $(".js-lightbox").removeClass("active");
      if (nowMode) nowMode.resume();
    }
  }

  $(".js-lightbox").on("click", function () {
    player.destroy();
    $(this).removeClass("active");
    if (nowMode) nowMode.resume();
  });
};
