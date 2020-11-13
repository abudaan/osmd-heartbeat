let btnPlay: HTMLButtonElement;
let btnStop: HTMLButtonElement;

export const setupSongControls = (song: Heartbeat.Song): void => {
  if(!btnPlay) {
    btnPlay = document.getElementById('play') as HTMLButtonElement;
    btnStop = document.getElementById('stop') as HTMLButtonElement;
  

  // setup controls
  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
    stopWatch();
    resetScore();
  });
  song.addEventListener('pause', () => {
    btnPlay.innerHTML = 'play';
    stopWatch();
  });
  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
    startWatch();
  });
  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
    stopWatch();
  });

  btnPlay.addEventListener('click', e => {
    e.stopImmediatePropagation();
    if (song.playing) {
      song.pause();
    } else {
      song.play();
    }
  });
  btnStop.addEventListener('click', e => {
    e.stopImmediatePropagation();
    song.stop();
    stopWatch();
    resetScore();
  });

  // everything has been setup so we can enable the buttons
  btnPlay.disabled = false;
  btnStop.disabled = false;
};
