import { loadStory } from './engine/story.js';
import { createGame, choose, resolveTest, describeTest, fightRound, fleeCombat } from './engine/game.js';
import { saveGame, loadGame, clearGame } from './storage.js';
import { isMuted, toggleMuted, vibrate, playDiceRattle, playHit, playWounded, playSuccess, playFailure } from './feedback.js';
import { replaceContent } from './ui/dom.js';
import { keepRollingDiceAlive } from './ui/dice.js';
import { renderHome } from './ui/home.js';
import { renderGame } from './ui/game.js';

const app = document.getElementById('app');
const ui = {
  screen: 'home',
  stories: [],
  story: null,
  state: null,
  menuOpen: false,
  roll: null,
  rollId: 0,
  fx: null,
};

async function boot() {
  const response = await fetch('stories/index.json');
  const entries = await response.json();
  ui.stories = await Promise.all(entries.map((entry) => loadStory(entry.path)));
  render();
}

function render() {
  if (ui.screen === 'home') {
    replaceContent(app, renderHome({
      stories: ui.stories,
      hasSave: (storyId) => loadGame(storyId) !== null,
      onStart: startStory,
      onContinue: continueStory,
      onRestart: startStory,
    }));
    return;
  }
  const fx = ui.fx;
  ui.fx = null;
  replaceContent(app, renderGame({
    story: ui.story,
    state: ui.state,
    menuOpen: ui.menuOpen,
    muted: isMuted(),
    roll: ui.roll,
    fx,
    handlers: {
      onChoose: (choice) => whenIdle(() => update(choose(ui.story, ui.state, choice))),
      onResolveTest: () => whenIdle(animateTest),
      onFight: () => whenIdle(animateAssault),
      onFlee: () => whenIdle(() => update(fleeCombat(ui.story, ui.state))),
      onToggleMenu: () => {
        ui.menuOpen = !ui.menuOpen;
        render();
      },
      onToggleSound: () => {
        toggleMuted();
        render();
      },
      onRestart: () => startStory(ui.story),
      onQuit: quitToHome,
    },
  }));
  if (ui.roll) {
    keepRollingDiceAlive();
  } else {
    window.scrollTo(0, 0);
  }
}

function whenIdle(action) {
  if (!ui.roll) {
    action();
  }
}

// Le résultat est calculé tout de suite, l'animation ne fait que le révéler.
function animateTest() {
  const previous = ui.state;
  const test = describeTest(ui.story, previous);
  const result = resolveTest(ui.story, previous);
  playDiceRattle();
  vibrate(30);
  runSequence({
    kind: 'test',
    phase: 'rolling',
    dice: result.dice,
    roll: result.roll,
    success: result.success,
    threshold: result.threshold,
    view: previous,
  }, [
    { after: 750, run: () => setRollPhase('settled') },
    {
      after: 450,
      run: () => {
        if (result.success) {
          playSuccess();
        } else {
          playFailure();
          vibrate([40, 40, 40]);
        }
        const stats = test.consumesLuck
          ? { ...previous.stats, chance: Math.max(0, previous.stats.chance - 1) }
          : previous.stats;
        ui.fx = { statDeltas: test.consumesLuck ? { chance: -1 } : {} };
        setRollPhase('verdict', { ...previous, stats });
      },
    },
    { after: 1100, run: () => update(result.state) },
  ]);
}

function animateAssault() {
  const previous = ui.state;
  const { state: next, round } = fightRound(ui.story, previous);
  playDiceRattle();
  vibrate(30);
  runSequence({ kind: 'combat', phase: 'rolling', round, view: previous }, [
    { after: 650, run: () => setRollPhase('enemy') },
    { after: 350, run: () => setRollPhase('hero') },
    {
      after: 450,
      run: () => {
        if (round.outcome === 'hit') playHit();
        if (round.outcome === 'wounded') {
          playWounded();
          vibrate(60);
        }
        ui.fx = {
          outcome: round.outcome,
          statDeltas: round.heroDamage ? { endurance: -round.heroDamage } : {},
          enemyFrom: previous.combat.enemyEndurance,
        };
        setRollPhase('verdict', {
          ...previous,
          stats: { ...previous.stats, endurance: Math.max(0, previous.stats.endurance - round.heroDamage) },
          combat: {
            ...previous.combat,
            round: previous.combat.round + 1,
            enemyEndurance: Math.max(0, previous.combat.enemyEndurance - round.enemyDamage),
          },
        });
      },
    },
    { after: 1000, run: () => update(next) },
  ]);
}

// Enchaîne les phases d'un lancer ; la séquence s'interrompt si la partie est quittée entre-temps.
function runSequence(roll, steps) {
  const id = ++ui.rollId;
  ui.roll = roll;
  render();
  let at = 0;
  for (const step of steps) {
    at += step.after;
    setTimeout(() => {
      if (ui.rollId === id) step.run();
    }, at);
  }
}

function setRollPhase(phase, view = ui.roll.view) {
  ui.roll = { ...ui.roll, phase, view };
  render();
}

function startStory(story) {
  clearGame(story.id);
  openGame(story, createGame(story));
}

function continueStory(story) {
  openGame(story, loadGame(story.id));
}

function openGame(story, state) {
  ui.screen = 'game';
  ui.story = story;
  ui.menuOpen = false;
  update(state);
}

function update(state) {
  ui.roll = null;
  ui.state = state;
  if (state.status === 'playing') {
    saveGame(ui.story.id, state);
  } else {
    clearGame(ui.story.id);
  }
  render();
}

function quitToHome() {
  ui.rollId += 1;
  ui.roll = null;
  ui.screen = 'home';
  ui.story = null;
  ui.state = null;
  render();
}

boot().catch((error) => {
  replaceContent(app, document.createTextNode(error.message));
  console.error(error);
});
