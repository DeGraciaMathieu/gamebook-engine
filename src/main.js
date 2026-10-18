import { loadStory } from './engine/story.js';
import { createGame, choose, resolveTest, fightRound, fleeCombat } from './engine/game.js';
import { saveGame, loadGame, clearGame } from './storage.js';
import { replaceContent } from './ui/dom.js';
import { renderHome } from './ui/home.js';
import { renderGame } from './ui/game.js';

const app = document.getElementById('app');
const ui = { screen: 'home', stories: [], story: null, state: null, lastRoll: null, inventoryOpen: false };

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
  replaceContent(app, renderGame({
    story: ui.story,
    state: ui.state,
    lastRoll: ui.lastRoll,
    inventoryOpen: ui.inventoryOpen,
    handlers: {
      onChoose: (choice) => update(choose(ui.story, ui.state, choice)),
      onResolveTest: () => {
        const result = resolveTest(ui.story, ui.state);
        update(result.state, { roll: result.roll, success: result.success });
      },
      onFight: () => update(fightRound(ui.story, ui.state)),
      onFlee: () => update(fleeCombat(ui.story, ui.state)),
      onToggleInventory: () => {
        ui.inventoryOpen = !ui.inventoryOpen;
        render();
      },
      onRestart: () => startStory(ui.story),
      onQuit: quitToHome,
    },
  }));
  window.scrollTo(0, 0);
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
  ui.inventoryOpen = false;
  update(state);
}

function update(state, lastRoll = null) {
  ui.state = state;
  ui.lastRoll = lastRoll;
  if (state.status === 'playing') {
    saveGame(ui.story.id, state);
  } else {
    clearGame(ui.story.id);
  }
  render();
}

function quitToHome() {
  ui.screen = 'home';
  ui.story = null;
  ui.state = null;
  render();
}

boot().catch((error) => {
  replaceContent(app, document.createTextNode(error.message));
  console.error(error);
});
