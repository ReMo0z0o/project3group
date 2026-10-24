/* Describe degenerate thresholds in words rather than dividing by zero in prose. */
function thresholdText(who, M) {
  const p = '<span class="m">p</span>';
  if (who === 'post') {
    if (!Number.isFinite(M.pW) || M.pW > 1) return 'Sous la menace d’une poursuite, aucune probabilité de victoire ne rend la publication rentable pour le Post.';
    if (M.pW <= 0) return 'Sous la menace d’une poursuite, le Post publie pour toute probabilité de victoire. À gain nul, notre convention retient la publication.';
    return `Sous la menace d’une poursuite, le Post publie si ${p} ≥ ${pct(M.pW)}.`;
  }
  if (!Number.isFinite(M.pG) || M.pG <= 0) return 'Avec ces paramètres, poursuivre le Post n’est strictement rentable pour aucune probabilité de victoire des journaux.';
  return `Si le Post publie, le gouvernement le poursuit si ${p} &lt; ${pct(M.pG)}.`;
}
