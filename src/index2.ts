import { getVersion } from 'webdaw-modules';
import { setup as setupDrawSelection, startSelect } from './drawSelection';
import { setup as setupSong } from './songWrapper';
import { setup as setupScore } from './scoreWrapper';
import { setup as setupControls } from './controls';
import { setup as setupPlayhead } from './playhead';
import { store } from './store';

console.log(`WebDAW: ${getVersion()}`);

let raqId: number;

const loop = () => {
  raqId = requestAnimationFrame(loop);
};

const init = async () => {
  await setupSong();
  await setupScore();
  setupControls();
  setupDrawSelection();
  setupPlayhead();

  window.addEventListener('resize', async () => {
    store.setState({ width: window.innerWidth });
  });

  window.addEventListener('scroll', e => {
    store.setState({ scrollPos: window.scrollY });
  });

  document.addEventListener('keydown', e => {
    if (e.keyCode === 13) {
      store.getState().toggleSongState();
    } else if (e.keyCode === 96) {
      store.setState({ songState: 'stop' });
    }
  });

  document.addEventListener('mousedown', e => {
    if (e.ctrlKey) {
      startSelect(e);
    } else {
      // setPlayhead(e);
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

  // everything has been setup so we can enable the buttons
  store.setState({ loaded: true });
};

init();
