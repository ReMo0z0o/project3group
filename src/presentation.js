/* Standalone illustrated narrative. Called after presentation.html is inserted. */
window.initPresentation = function initPresentation() {
  const player = document.getElementById('storyPresentation');
  if (!player || player.dataset.storyInitialized) return;
  player.dataset.storyInitialized = 'true';
  const scenes = [
    { date: '1969 — 1971 · Le lanceur d’alerte', heading: 'La vérité sort de l’ombre.', text: 'Daniel Ellsberg photocopie une étude secrète sur le Vietnam. Des milliers de pages contredisent le récit officiel.', alt: 'Daniel Ellsberg photocopie les documents secrets sur une machine Xerox.' },
    { date: '13 juin 1971 · New York', heading: 'Le premier journal publie.', text: 'Le New York Times révèle les Pentagon Papers. L’information devient publique ; le conflit avec le pouvoir commence.', alt: 'La première page du New York Times sort d’une presse à imprimer.' },
    { date: '15 juin 1971 · L’injonction', heading: 'Le pouvoir tente de faire taire.', text: 'L’administration Nixon invoque la sécurité nationale. Un juge suspend la publication du New York Times.', alt: 'Une injonction judiciaire et un tampon de censure recouvrent la une du journal.' },
    { date: '18 juin 1971 · Washington', heading: '« On publie. »', text: 'Malgré les risques financiers et judiciaires, Katharine Graham et Ben Bradlee décident de publier dans le Washington Post.', alt: 'La une du Washington Post paraît sur le bureau de Katharine Graham avec la décision : On publie.' },
    { date: '30 juin 1971 · La Cour suprême', heading: 'La presse obtient gain de cause.', text: 'Par six voix contre trois, la Cour suprême rejette les restrictions demandées par le gouvernement. Les journaux peuvent publier.', alt: 'La façade de la Cour suprême et le résultat du vote : six voix contre trois.' }
  ];
  const nodes = Array.from(player.querySelectorAll('[data-story-scene]'));
  const segments = Array.from(player.querySelectorAll('[data-story-goto]'));
  const play = player.querySelector('[data-story-play]');
  const previous = player.querySelector('[data-story-prev]');
  const next = player.querySelector('[data-story-next]');
  const title = player.querySelector('#story-svg-title');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 6000;
  let current = 0;
  let elapsed = 0;
  let lastFrame = null;
  let playing = false;
  let finished = false;
  let frame = null;

  function updateButton() {
    const label = playing ? 'Mettre en pause' : finished ? 'Revoir la séquence' : elapsed > 0 || current > 0 ? 'Reprendre le récit' : 'Lancer la séquence';
    play.setAttribute('aria-pressed', String(playing));
    play.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true">' + (playing ? '<path d="M2 1h3v10H2zM7 1h3v10H7z"/>' : '<path d="M2 1l9 5-9 5z"/>') + '</svg><span>' + label + '</span>';
    player.classList.toggle('story-playing', playing);
  }
  function showScene(index) {
    current = Math.max(0, Math.min(scenes.length - 1, index));
    const item = scenes[current];
    nodes.forEach((node, i) => { node.classList.toggle('story-current', i === current); node.setAttribute('aria-hidden', String(i !== current)); });
    segments.forEach((button, i) => {
      button.classList.toggle('story-active', i === current);
      button.classList.toggle('story-complete', i < current);
      if (i === current) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    player.querySelector('[data-story-number]').textContent = String(current + 1).padStart(2, '0');
    player.querySelector('[data-story-counter]').textContent = String(current + 1).padStart(2, '0') + ' / 05';
    player.querySelector('[data-story-date]').textContent = item.date;
    player.querySelector('[data-story-heading]').textContent = item.heading;
    player.querySelector('[data-story-description]').textContent = item.text;
    if (title) title.textContent = item.alt;
    previous.disabled = current === 0;
    next.disabled = current === scenes.length - 1;
    player.style.setProperty('--story-progress', String(elapsed / duration));
    updateButton();
  }
  function pause() {
    playing = false;
    lastFrame = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    updateButton();
  }
  function tick(timestamp) {
    if (!playing) return;
    if (lastFrame !== null) elapsed += Math.min(timestamp - lastFrame, 120);
    lastFrame = timestamp;
    if (elapsed >= duration) {
      if (current === scenes.length - 1) {
        elapsed = duration;
        finished = true;
        player.style.setProperty('--story-progress', '1');
        pause();
        return;
      }
      elapsed = 0;
      showScene(current + 1);
    }
    const progress = reducedMotion.matches ? (elapsed > 0 ? .05 : 0) : elapsed / duration;
    player.style.setProperty('--story-progress', String(progress));
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (finished) { finished = false; elapsed = 0; showScene(0); }
    playing = true;
    lastFrame = null;
    updateButton();
    frame = requestAnimationFrame(tick);
  }
  function go(index) {
    elapsed = 0;
    finished = false;
    lastFrame = null;
    showScene(index);
  }
  play.addEventListener('click', () => { if (playing) pause(); else start(); });
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  segments.forEach(button => button.addEventListener('click', () => go(Number(button.dataset.storyGoto))));
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && playing) pause();
    }, { threshold: 0 });
    observer.observe(player);
  }
  showScene(0);
};
