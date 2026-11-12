// Ambiance sonore d'une histoire : une vidéo YouTube lue en boucle dans un iframe invisible.
// Le lecteur vit hors de #app, que chaque rendu remplace entièrement.
import { el } from './ui/dom.js';
import { youtubeVideoId } from './engine/story.js';

let apiReady = null;
let player = null;
let videoId = null;
let container = null;
let toggle = null;

function loadApi() {
  apiReady ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve;
    document.head.append(el('script', { src: 'https://www.youtube.com/iframe_api' }));
  });
  return apiReady;
}

export async function startAmbience(url) {
  const id = youtubeVideoId(url);
  if (id === videoId) return;
  stopAmbience();
  if (!id) return;
  videoId = id;
  const frame = el('div');
  toggle = el('button', { class: 'ambience-toggle', 'aria-label': 'Lancer l\'ambiance sonore', onClick: togglePlayback }, '▶');
  container = el('div', { class: 'ambience' }, [el('div', { class: 'ambience-frame' }, frame), toggle]);
  document.body.append(container);
  await loadApi();
  if (videoId !== id) return;
  player = new window.YT.Player(frame, {
    host: 'https://www.youtube-nocookie.com',
    videoId: id,
    playerVars: { autoplay: 1, controls: 0 },
    events: { onStateChange: handleStateChange },
  });
}

export function stopAmbience() {
  player?.destroy();
  container?.remove();
  player = null;
  videoId = null;
  container = null;
  toggle = null;
}

function togglePlayback() {
  if (player?.getPlayerState?.() === window.YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player?.playVideo?.();
  }
}

function handleStateChange({ data }) {
  if (data === window.YT.PlayerState.ENDED) {
    player.playVideo();
    return;
  }
  const playing = data === window.YT.PlayerState.PLAYING;
  toggle.textContent = playing ? '❚❚' : '▶';
  toggle.setAttribute('aria-label', playing ? 'Mettre l\'ambiance sonore en pause' : 'Lancer l\'ambiance sonore');
}
