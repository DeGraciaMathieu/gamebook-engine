const PREFIX = 'adventuregame:save:';

export function saveGame(storyId, state) {
  try {
    localStorage.setItem(PREFIX + storyId, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la partie continue sans sauvegarde.
  }
}

export function loadGame(storyId) {
  try {
    const raw = localStorage.getItem(PREFIX + storyId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGame(storyId) {
  try {
    localStorage.removeItem(PREFIX + storyId);
  } catch {
    // Rien à faire : s'il n'y a pas de stockage, il n'y a pas de sauvegarde.
  }
}
