import { el } from './dom.js';

const PIP_COUNT = 9;
const ROLL_TICK_MS = 90;

// Un dé à six faces dessiné en CSS ; la face 0 est un dé vide, pas encore lancé.
function renderDie(face, { rolling = false, settled = false } = {}) {
  const classes = ['die', rolling && 'is-rolling', settled && 'is-settled'].filter(Boolean).join(' ');
  return el('span', { class: classes, 'data-face': face, 'aria-label': face ? `dé : ${face}` : 'dé' },
    Array.from({ length: PIP_COUNT }, () => el('span', { class: 'pip' })));
}

export function renderDice(faces, options) {
  return el('span', { class: 'dice' }, faces.map((face) => renderDie(face, options)));
}

let ticker = null;

// Fait défiler des faces aléatoires sur tous les dés en cours de lancer, tant qu'il en reste.
export function keepRollingDiceAlive() {
  if (ticker) {
    return;
  }
  ticker = setInterval(() => {
    const rolling = document.querySelectorAll('.die.is-rolling');
    if (rolling.length === 0) {
      clearInterval(ticker);
      ticker = null;
      return;
    }
    rolling.forEach((die) => {
      die.dataset.face = String(1 + Math.floor(Math.random() * 6));
    });
  }, ROLL_TICK_MS);
}
