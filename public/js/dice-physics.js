/**
 * Dés physiques (matter.js) — rebonds réalistes dans l'arène de lancer.
 *
 * Le résultat vient TOUJOURS du serveur : la simulation est purement
 * cosmétique. Deux corps rigides sont jetés dans l'arène et rebondissent
 * sur les parois ; tant que le résultat n'est pas connu (lancer local en
 * attente du serveur) ils sont relancés par petites impulsions, puis
 * `setResult(d1, d2)` fige les faces sur le résultat officiel.
 *
 * Fallback : si matter.js n'est pas chargé ou si reduce-motion est actif,
 * le client garde l'animation CSS existante (rien n'est monté ici).
 */
(function () {
  'use strict';

  let active = null; // { engine, raf, canvas, ... }

  function available() {
    return typeof window.Matter !== 'undefined';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
    6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
  };

  function drawDie(ctx, body, size, face, skin) {
    const half = size / 2;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    // Ombre portée légère pour ancrer le dé dans l'arène
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.08;
    ctx.fillStyle = skin.bg || '#ffffff';
    roundRect(ctx, -half, -half, size, size, size * 0.18);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (skin.border && skin.border !== 'transparent') {
      ctx.lineWidth = Math.max(1.5, size * 0.05);
      ctx.strokeStyle = skin.border;
      ctx.stroke();
    }
    ctx.fillStyle = skin.color || '#1a1a2e';
    const pr = size * 0.085;
    for (const [px, py] of PIPS[face] || PIPS[1]) {
      ctx.beginPath();
      ctx.arc((px - 0.5) * size, (py - 0.5) * size, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function stop() {
    if (!active) return;
    const a = active;
    active = null;
    cancelAnimationFrame(a.raf);
    // Fondu de sortie : laisse les dés CSS (déjà posés) réapparaître sans saut brutal.
    a.canvas.style.opacity = '0';
    setTimeout(() => { try { a.canvas.remove(); } catch (_) {} }, 260);
  }

  function setResult(d1, d2) {
    if (!active) return;
    active.result = { d1, d2 };
  }

  /** Lance la simulation dans `arenaEl`. Tourne jusqu'à stop(). */
  function roll(arenaEl, skin) {
    if (!available() || !arenaEl) return false;
    stop();

    const { Engine, Bodies, Body, Composite } = window.Matter;
    const rect = arenaEl.getBoundingClientRect();
    const W = Math.max(rect.width, 120);
    const H = Math.max(rect.height, 90);
    if (W < 10 || H < 10) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = document.createElement('canvas');
    canvas.className = 'dice-physics-canvas';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;transition:opacity .25s ease;';
    if (getComputedStyle(arenaEl).position === 'static') arenaEl.style.position = 'relative';
    arenaEl.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const engine = Engine.create({ gravity: { x: 0, y: 1.4 } });
    const size = Math.min(54, Math.max(34, W * 0.16));
    const wallOpts = { isStatic: true, restitution: 0.9 };
    const t = 80; // murs épais hors-champ pour qu'aucun dé ne s'échappe
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + t / 2 - 4, W * 2, t, wallOpts),   // sol
      Bodies.rectangle(W / 2, -t / 2 - 60, W * 2, t, wallOpts),     // plafond
      Bodies.rectangle(-t / 2 + 2, H / 2, t, H * 4, wallOpts),      // gauche
      Bodies.rectangle(W + t / 2 - 2, H / 2, t, H * 4, wallOpts),   // droite
    ]);

    const mkDie = (x, vx) => {
      const b = Bodies.rectangle(x, -size / 2, size, size, {
        restitution: 0.55, friction: 0.12, frictionAir: 0.012, density: 0.0018,
        chamfer: { radius: size * 0.16 },
      });
      Body.setVelocity(b, { x: vx, y: 4 + Math.random() * 3 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.55);
      Composite.add(engine.world, b);
      return b;
    };
    const bodyA = mkDie(W * 0.3, 3 + Math.random() * 3);
    const bodyB = mkDie(W * 0.7, -(3 + Math.random() * 3));

    const start = performance.now();
    let last = start;
    let lastKick = start;
    let lastFaceSwap = 0;
    let faceA = 1 + Math.floor(Math.random() * 6);
    let faceB = 1 + Math.floor(Math.random() * 6);
    let settled = false;
    let resultAt = 0;

    active = { engine, raf: 0, canvas, result: null };

    function frame(now) {
      if (!active || active.engine !== engine) return;
      const dt = Math.min(now - last, 33);
      last = now;
      Engine.update(engine, dt);
      const elapsed = now - start;
      const speed = bodyA.speed + bodyB.speed
        + Math.abs(bodyA.angularSpeed) * 30 + Math.abs(bodyB.angularSpeed) * 30;

      if (!settled && active.result && !resultAt) resultAt = now;

      if (!settled && resultAt && (speed < 1.2 || now - resultAt > 900) && elapsed > 600) {
        // Résultat connu et dés (presque) arrêtés : on fige sur le score officiel.
        settled = true;
        faceA = active.result.d1; faceB = active.result.d2;
        for (const b of [bodyA, bodyB]) {
          Body.setAngle(b, Math.round(b.angle / (Math.PI / 2)) * (Math.PI / 2));
          Body.setAngularVelocity(b, 0);
          Body.setVelocity(b, { x: 0, y: Math.min(b.velocity.y, 0.5) });
        }
      } else if (!settled) {
        if (now - lastFaceSwap > 90) {
          // Faces qui défilent tant que ça roule (illusion de rotation 3D)
          lastFaceSwap = now;
          faceA = 1 + Math.floor(Math.random() * 6);
          faceB = 1 + Math.floor(Math.random() * 6);
        }
        if (!active.result && speed < 1 && now - lastKick > 650) {
          // Pas encore de résultat serveur : on relance pour ne pas mourir à plat.
          lastKick = now;
          for (const b of [bodyA, bodyB]) {
            Body.setVelocity(b, { x: (Math.random() - 0.5) * 7, y: -(4 + Math.random() * 3) });
            Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.5);
          }
        }
      }

      ctx.clearRect(0, 0, W, H);
      drawDie(ctx, bodyA, size, faceA, skin);
      drawDie(ctx, bodyB, size, faceB, skin);

      if (elapsed > 30000) { stop(); return; } // garde-fou
      active.raf = requestAnimationFrame(frame);
    }
    active.raf = requestAnimationFrame(frame);
    return true;
  }

  window.RdmDicePhysics = { available, roll, setResult, stop, isActive: () => !!active };
})();
