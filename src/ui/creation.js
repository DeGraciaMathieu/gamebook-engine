import { el } from './dom.js';

// Écran de création : le joueur répartit toute la réserve de points avant de commencer.
export function renderCreation({ story, creation, allocation, handlers }) {
  const spent = Object.values(allocation).reduce((sum, bonus) => sum + bonus, 0);
  const remaining = creation.points - spent;
  return el('main', { class: 'screen creation' }, [
    el('header', { class: 'creation-header' }, [
      el('button', { class: 'btn-icon', 'aria-label': 'Retour à la bibliothèque', onClick: handlers.onQuit }, '‹'),
      el('h1', { class: 'creation-title' }, story.title),
    ]),
    el('p', { class: 'creation-intro' }, 'Répartissez vos points avant de partir à l\'aventure.'),
    el('p', { class: `creation-remaining${remaining === 0 ? ' is-complete' : ''}` }, [
      el('strong', {}, String(remaining)),
      remaining > 1 ? ' points à placer' : ' point à placer',
    ]),
    el('ul', { class: 'creation-stats' }, creation.stats.map((stat) =>
      renderStatRow(stat, allocation[stat.name] ?? 0, remaining, handlers))),
    el('div', { class: 'choices' }, [
      el('button', { class: 'btn btn-primary', disabled: remaining !== 0, onClick: handlers.onStart }, 'Commencer l\'aventure'),
    ]),
  ]);
}

function renderStatRow(stat, bonus, remaining, handlers) {
  const value = stat.base + bonus;
  return el('li', { class: 'creation-stat' }, [
    el('div', { class: 'creation-stat-info' }, [
      el('span', { class: 'creation-stat-label' }, stat.label),
      el('span', { class: 'creation-stat-range' }, `${stat.base} à ${stat.max}`),
    ]),
    el('div', { class: 'stepper' }, [
      el('button', {
        class: 'stepper-btn',
        'aria-label': `Retirer un point de ${stat.label}`,
        disabled: bonus === 0,
        onClick: () => handlers.onAdjust(stat.name, -1),
      }, '−'),
      el('span', { class: 'stepper-value' }, String(value)),
      el('button', {
        class: 'stepper-btn',
        'aria-label': `Ajouter un point à ${stat.label}`,
        disabled: remaining === 0 || value >= stat.max,
        onClick: () => handlers.onAdjust(stat.name, 1),
      }, '+'),
    ]),
  ]);
}
