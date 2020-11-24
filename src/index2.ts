import { getVersion } from 'webdaw-modules';
import { store } from './store';
import { setup as setupSong } from './songWrapper';
import { setup as setupScore, getPositionInMeasure } from './scoreWrapper';
import { setup as setupControls } from './controls';
import { setup as setupPlayhead } from './playhead';
import { setup as setupDrawLoop } from './drawLoop';
import { setup as setupDrawSelection, startSelect } from './drawSelection';

const scoreDiv = document.getElementById('score') as HTMLDivElement;
const loadingDiv = document.getElementById('loading');

if (scoreDiv === null || loadingDiv === null) {
  throw new Error('element not found');
}

console.log(`WebDAW: ${getVersion()}`);

let raqId: number;

const loop = () => {
  // you can do something here if necessary
  raqId = requestAnimationFrame(loop);
};

const init = async () => {
  await setupSong();
  await setupScore(scoreDiv);
  setupControls();
  setupPlayhead();
  setupDrawLoop();
  setupDrawSelection();

  window.addEventListener('resize', () => {
    store.setState({ width: window.innerWidth });
  });

  window.addEventListener('scroll', () => {
    store.setState({ scrollPos: { y: window.scrollY, x: window.scrollX } });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      store.setState({ songState: 'play' });
    } else if (e.key === 'Space') {
      e.preventDefault();
      store.getState().toggleSongState();
    }
  });

  scoreDiv.addEventListener('mousedown', e => {
    if (e.ctrlKey) {
      startSelect(e);
    } else {
      getPositionInMeasure(e);
    }
  });

  // main loop during playback
  store.subscribe(
    songState => {
      if (songState === 'play') {
        raqId = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raqId);
      }
    },
    state => state.songState
  );

  loadingDiv.style.display = 'none';
  store.setState({ loaded: true });
};

init();
