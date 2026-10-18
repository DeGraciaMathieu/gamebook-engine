import { el } from './dom.js';

export function renderHome({ stories, hasSave, onStart, onContinue, onRestart }) {
  return el('main', { class: 'screen home' }, [
    el('header', { class: 'home-header' }, [
      el('p', { class: 'home-kicker' }, 'Livres dont vous êtes le héros'),
      el('h1', { class: 'home-title' }, 'Bibliothèque'),
    ]),
    el('ul', { class: 'story-list' }, stories.map((story) => renderStoryCard(story, {
      hasSave: hasSave(story.id), onStart, onContinue, onRestart,
    }))),
  ]);
}

function renderStoryCard(story, { hasSave, onStart, onContinue, onRestart }) {
  const actions = hasSave
    ? [
      el('button', { class: 'btn btn-primary', onClick: () => onContinue(story) }, 'Continuer'),
      el('button', { class: 'btn btn-ghost', onClick: () => onRestart(story) }, 'Recommencer'),
    ]
    : [el('button', { class: 'btn btn-primary', onClick: () => onStart(story) }, 'Commencer')];

  return el('li', { class: 'story-card' }, [
    el('h2', { class: 'story-card-title' }, story.title),
    el('p', { class: 'story-card-summary' }, story.summary),
    el('div', { class: 'story-card-actions' }, actions),
  ]);
}
