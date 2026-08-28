const CLE_GARDE_MANGER = 'unburn:garde-manger';
const CLE_DERNIERE_SELECTION = 'unburn:derniere-selection';

function lire(cle) {
  const brut = localStorage.getItem(cle);
  return brut ? JSON.parse(brut) : [];
}

function ecrire(cle, ids) {
  localStorage.setItem(cle, JSON.stringify(ids));
}

export function lireGardeManger() {
  return lire(CLE_GARDE_MANGER);
}

export function ecrireGardeManger(ids) {
  ecrire(CLE_GARDE_MANGER, ids);
}

export function lireDerniereSelection() {
  return lire(CLE_DERNIERE_SELECTION);
}

export function ecrireDerniereSelection(ids) {
  ecrire(CLE_DERNIERE_SELECTION, ids);
}
