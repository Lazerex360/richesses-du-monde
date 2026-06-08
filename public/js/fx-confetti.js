/**
 * Confettis DOM légers — victoire uniquement, sans impact gameplay.
 */
function launchConfetti(count = 72) {
  if (document.body.classList.contains('reduce-motion')) return;
  const layer = document.createElement('div');
  layer.className = 'rdm-confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  const colors = ['#c9a04a', '#e8c878', '#3dd68c', '#4db5ff', '#a78bfa', '#f06555'];
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement('span');
    p.className = 'rdm-confetti-piece';
    p.style.setProperty('--cf-x', `${(Math.random() - 0.5) * 120}vw`);
    p.style.setProperty('--cf-rot', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--cf-dur', `${1.8 + Math.random() * 1.4}s`);
    p.style.setProperty('--cf-delay', `${Math.random() * 0.35}s`);
    p.style.background = colors[i % colors.length];
    p.style.width = `${5 + Math.random() * 7}px`;
    p.style.height = `${8 + Math.random() * 10}px`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4200);
}

window.RdmFx = { confetti: launchConfetti };
