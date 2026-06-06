/**
 * Dés 3D CSS — faces avec points, rotation et animation de lancer.
 */
(function (global) {
  const SIZE = 56;
  const HALF = SIZE / 2;

  const PIP_LAYOUTS = {
    1: ['c'],
    2: ['tl', 'br'],
    3: ['tl', 'c', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'c', 'bl', 'br'],
    6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'],
  };

  const FACE_ROTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 0, y: 180 },
  };

  function buildFaceHtml(value) {
    const pips = (PIP_LAYOUTS[value] || []).map((pos) => `<span class="pip pip-${pos}"></span>`).join('');
    return `<div class="dice-face face-${value}" data-value="${value}">${pips}</div>`;
  }

  function buildCubeHtml() {
    return [1, 2, 3, 4, 5, 6].map(buildFaceHtml).join('');
  }

  function initCube(cubeEl, value = 1) {
    if (!cubeEl || cubeEl.dataset.dice3dInit === '1') return cubeEl;
    cubeEl.innerHTML = buildCubeHtml();
    cubeEl.dataset.dice3dInit = '1';
    cubeEl.style.setProperty('--dice-size', `${SIZE}px`);
    cubeEl.style.setProperty('--dice-half', `${HALF}px`);
    setCubeValue(cubeEl, value, { animate: false });
    return cubeEl;
  }

  function applySkinToScene(sceneEl, style) {
    if (!sceneEl || !style) return;
    sceneEl.style.setProperty('--dice-bg', style.bg || '#ffffff');
    sceneEl.style.setProperty('--dice-pip', style.color || '#1a1a2e');
    sceneEl.style.setProperty('--dice-border', style.border || 'transparent');
    sceneEl.dataset.diceSkin = style.bg || '';
  }

  function rotationForValue(value) {
    const r = FACE_ROTATIONS[value] || FACE_ROTATIONS[1];
    return { x: r.x, y: r.y };
  }

  function setCubeTransform(cubeEl, x, y, animate) {
    cubeEl.style.transition = animate ? 'transform 1.2s cubic-bezier(0.12, 0.9, 0.22, 1)' : 'none';
    cubeEl.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    cubeEl.dataset.rotX = String(x);
    cubeEl.dataset.rotY = String(y);
    cubeEl.dataset.value = String(valueFromRotation(x, y));
  }

  function valueFromRotation(x, y) {
    const nx = ((x % 360) + 360) % 360;
    const ny = ((y % 360) + 360) % 360;
    for (const [val, rot] of Object.entries(FACE_ROTATIONS)) {
      const rx = ((rot.x % 360) + 360) % 360;
      const ry = ((rot.y % 360) + 360) % 360;
      if (Math.abs(nx - rx) < 2 && Math.abs(ny - ry) < 2) return Number(val);
    }
    return 1;
  }

  function setCubeValue(cubeEl, value, { animate = false } = {}) {
    if (!cubeEl) return;
    initCube(cubeEl, value);
    const rot = rotationForValue(value);
    setCubeTransform(cubeEl, rot.x, rot.y, animate);
  }

  function startWildRoll(cubeEl) {
    if (!cubeEl) return;
    if (cubeEl.dataset.dice3dInit !== '1') initCube(cubeEl, 1);
    cubeEl.classList.remove('dice-landing');
    cubeEl.classList.add('dice-wild');
    cubeEl.style.transition = 'none';
  }

  function landCube(cubeEl, value, onDone) {
    if (!cubeEl) {
      if (onDone) onDone();
      return;
    }
    cubeEl.classList.remove('dice-wild');
    cubeEl.classList.add('dice-landing');

    const target = rotationForValue(value);
    const baseX = Number(cubeEl.dataset.rotX || 0);
    const baseY = Number(cubeEl.dataset.rotY || 0);
    const extraX = (3 + Math.floor(Math.random() * 3)) * 360;
    const extraY = (3 + Math.floor(Math.random() * 3)) * 360;
    const endX = baseX + extraX + target.x;
    const endY = baseY + extraY + target.y;

    requestAnimationFrame(() => {
      setCubeTransform(cubeEl, endX, endY, true);
    });

    const onEnd = (e) => {
      if (e.propertyName !== 'transform') return;
      cubeEl.removeEventListener('transitionend', onEnd);
      cubeEl.classList.remove('dice-landing');
      const snap = rotationForValue(value);
      setCubeTransform(cubeEl, snap.x, snap.y, false);
      cubeEl.dataset.value = String(value);
      if (onDone) onDone();
    };
    cubeEl.addEventListener('transitionend', onEnd);
  }

  function landBothCubes(cube1, cube2, v1, v2, onDone) {
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending <= 0 && onDone) onDone();
    };
    landCube(cube1, v1, done);
    landCube(cube2, v2, done);
  }

  const Dice3D = {
    SIZE,
    initCube,
    applySkinToScene,
    setCubeValue,
    startWildRoll,
    landCube,
    landBothCubes,
    buildPreviewHtml(style, value = 5) {
      const bg = style?.bg || '#ffffff';
      const pip = style?.color || '#1a1a2e';
      const border = style?.border || 'transparent';
      return `<div class="dice-scene dice-scene--preview" style="--dice-bg:${bg};--dice-pip:${pip};--dice-border:${border}">
        <div class="dice-cube dice-cube--preview">${buildCubeHtml()}</div>
      </div>`;
    },
    buildFlatPreviewHtml(style, value = 5) {
      const bg = style?.bg || '#ffffff';
      const pip = style?.color || '#1a1a2e';
      const border = style?.border || 'transparent';
      const pips = (PIP_LAYOUTS[value] || []).map((pos) => `<span class="pip pip-${pos}"></span>`).join('');
      return `<div class="dice-flat-preview" style="--dice-bg:${bg};--dice-pip:${pip};--dice-border:${border}" aria-hidden="true">
        <div class="dice-flat-face">${pips}</div>
      </div>`;
    },
    initPreview(el, value = 5) {
      const cube = el?.querySelector('.dice-cube');
      if (cube) setCubeValue(cube, value, { animate: false });
    },
  };

  global.Dice3D = Dice3D;
})(typeof window !== 'undefined' ? window : globalThis);
