import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { State, store } from './store';

type Args = {
  div: HTMLElement;
  osmd: OpenSheetMusicDisplay;
};
export const resizeScore = ({ div, osmd }: Args) => {
  osmd.render();
  store.setState({
    scoreDivOffsetX: div.offsetLeft,
    scoreDivOffsetY: div.offsetTop,
  });

  const textElements = document.getElementsByTagName('text');
  for (let i = 0; i < textElements.length; i++) {
    const el = textElements[i];
    if (el.innerHTML === 'f') {
      el.setAttribute('font-weight', 'normal');
      el.setAttribute('font-style', 'normal');
    }
  }
};
