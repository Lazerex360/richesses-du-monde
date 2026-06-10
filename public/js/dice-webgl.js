/**
 * Dés WebGL Three.js — #die1 / #die2 avec ombre, rebond et fallback CSS.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const FACE_ROT = {
  1: { x: 0, y: 0 }, 2: { x: 0, y: -90 }, 3: { x: -90, y: 0 },
  4: { x: 90, y: 0 }, 5: { x: 0, y: 90 }, 6: { x: 0, y: 180 },
};
const PIP_POS = {
  1: [[0.5, 0.5]], 2: [[0.28, 0.28], [0.72, 0.72]], 3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.28], [0.28, 0.5], [0.28, 0.72], [0.72, 0.28], [0.72, 0.5], [0.72, 0.72]],
};

const instances = new Map();
const failed = new WeakSet();
const active = new Set();
let raf = 0;
let webglEnabled = true;

function canUseWebgl() {
  return webglEnabled && window.RdmCinematic?.isActive?.() !== false;
}

function disposeAll() {
  instances.forEach((inst) => {
    inst.renderer?.dispose();
    inst.sceneEl?.classList.remove('dice-scene--webgl');
    inst.sceneEl?.querySelector('.dice-webgl-canvas')?.remove();
    if (inst.cubeEl) inst.cubeEl.style.visibility = '';
  });
  instances.clear();
  active.clear();
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

window.RdmDiceWebgl = {
  setEnabled(on) {
    webglEnabled = !!on;
    if (!on) disposeAll();
  },
};

function pipTexture(val, bg, pip) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, shadeColor(bg, -12));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = pip;
  const r = 10;
  (PIP_POS[val] || PIP_POS[1]).forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px * 128, py * 128, r, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function shadeColor(hex, amt) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function makeMaterials(bg, pip) {
  return [1, 2, 3, 4, 5, 6].map((v) => new THREE.MeshPhysicalMaterial({
    map: pipTexture(v, bg, pip),
    metalness: 0.18, roughness: 0.32, clearcoat: 0.65, clearcoatRoughness: 0.2,
    reflectivity: 0.35,
  }));
}

function isGameDie(el) {
  return el?.id === 'die1' || el?.id === 'die2';
}

function scheduleFrame() {
  if (raf) return;
  const tick = (now) => {
    raf = 0;
    let running = false;
    active.forEach((inst) => { if (inst.step(now)) running = true; });
    active.forEach((inst) => inst.render());
    if (running) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function createInstance(cubeEl) {
  if (failed.has(cubeEl)) return null;
  const sceneEl = cubeEl.closest('.dice-scene');
  if (!sceneEl) return null;

  try {
    const w = Math.max(sceneEl.clientWidth || 48, 32);
    const h = Math.max(sceneEl.clientHeight || 48, 32);
    const canvas = document.createElement('canvas');
    canvas.className = 'dice-webgl-canvas';
    sceneEl.classList.add('dice-scene--webgl');
    sceneEl.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 20);
    camera.position.set(0, 0.35, 2.75);
    camera.lookAt(0, 0, 0);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.62;
    scene.add(shadow);

    const bg = sceneEl.style.getPropertyValue('--dice-bg').trim() || '#f4f4f8';
    const pip = sceneEl.style.getPropertyValue('--dice-pip').trim() || '#1a1a2e';
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.9, 0.9, 8, 0.12), makeMaterials(bg, pip));
    scene.add(mesh);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xfff4d8, 1.25);
    dl.position.set(2.5, 4, 3);
    scene.add(dl);
    const pl = new THREE.PointLight(0xc9a04a, 0.65, 10);
    pl.position.set(-1.2, 1.5, 2.5);
    scene.add(pl);
    const rim = new THREE.PointLight(0x4db5ff, 0.25, 8);
    rim.position.set(1.5, -0.5, -1);
    scene.add(rim);

    const inst = {
      cubeEl, sceneEl, renderer, scene, camera, mesh, shadow,
      rx: 0, ry: 0, wild: false, anim: null, bounce: 0,
      updateSkin(bgC, pipC) {
        mesh.material = makeMaterials(bgC, pipC);
      },
      setRot(x, y) {
        this.rx = x; this.ry = y;
        mesh.rotation.x = THREE.MathUtils.degToRad(x);
        mesh.rotation.y = THREE.MathUtils.degToRad(y);
      },
      setBounce(v) {
        mesh.position.y = v;
        shadow.scale.setScalar(1 - v * 0.15);
        shadow.material.opacity = 0.28 - v * 0.08;
      },
      step(now) {
        if (this.wild) {
          this.rx += 20 + Math.random() * 10;
          this.ry += 24 + Math.random() * 12;
          this.setRot(this.rx, this.ry);
          this.setBounce(Math.sin(now * 0.012) * 0.06);
          return true;
        }
        if (this.bounce > 0) {
          this.bounce = Math.max(0, this.bounce - 0.04);
          this.setBounce(Math.sin(this.bounce * Math.PI) * 0.14);
          return true;
        }
        if (this.anim) {
          const p = Math.min(1, (now - this.anim.t0) / this.anim.dur);
          const e = 1 - Math.pow(1 - p, 3);
          this.setRot(
            this.anim.sx + (this.anim.ex - this.anim.sx) * e,
            this.anim.sy + (this.anim.ey - this.anim.sy) * e,
          );
          if (p > 0.7) this.bounce = (p - 0.7) / 0.3;
          if (p >= 1) {
            this.setRot(this.anim.ex, this.anim.ey);
            this.bounce = 1;
            const cb = this.anim.done;
            this.anim = null;
            active.add(this);
            scheduleFrame();
            if (cb) cb();
            return true;
          }
          return true;
        }
        return false;
      },
      render() {
        const sw = Math.max(this.sceneEl.clientWidth || 48, 32);
        const sh = Math.max(this.sceneEl.clientHeight || 48, 32);
        const pr = renderer.getPixelRatio();
        if (renderer.domElement.width !== Math.floor(sw * pr)) {
          renderer.setSize(sw, sh, false);
          this.camera.aspect = sw / sh;
          this.camera.updateProjectionMatrix();
        }
        renderer.render(scene, camera);
      },
      land(value, onDone) {
        this.wild = false;
        const t = FACE_ROT[value] || FACE_ROT[1];
        const ex = this.rx + (3 + Math.floor(Math.random() * 3)) * 360 + t.x;
        const ey = this.ry + (3 + Math.floor(Math.random() * 3)) * 360 + t.y;
        this.anim = { t0: performance.now(), dur: 1350, sx: this.rx, sy: this.ry, ex, ey, done: onDone };
        active.add(this);
        scheduleFrame();
      },
    };
    instances.set(cubeEl, inst);
    return inst;
  } catch (_) {
    failed.add(cubeEl);
    sceneEl?.classList.remove('dice-scene--webgl');
    return null;
  }
}

function getInst(cubeEl) {
  if (!canUseWebgl() || !isGameDie(cubeEl) || failed.has(cubeEl)) return null;
  return instances.get(cubeEl) || createInstance(cubeEl);
}

function patch() {
  const D = window.Dice3D;
  if (!D || D._webglPatched) return;

  const origInit = D.initCube.bind(D);
  const origSkin = D.applySkinToScene.bind(D);
  const origSet = D.setCubeValue.bind(D);
  const origWild = D.startWildRoll.bind(D);
  const origLand = D.landCube.bind(D);

  D.initCube = (cubeEl, value = 1) => {
    origInit(cubeEl, value);
    if (!isGameDie(cubeEl)) return cubeEl;
    const inst = getInst(cubeEl);
    if (inst) {
      const rot = FACE_ROT[value] || FACE_ROT[1];
      inst.setRot(rot.x, rot.y);
      inst.setBounce(0);
      inst.render();
    }
    return cubeEl;
  };

  D.applySkinToScene = (sceneEl, style) => {
    origSkin(sceneEl, style);
    const bg = style?.bg || '#ffffff';
    const pip = style?.color || '#1a1a2e';
    sceneEl.querySelectorAll('.dice-cube').forEach((cube) => {
      const inst = instances.get(cube);
      if (inst) inst.updateSkin(bg, pip);
    });
  };

  D.setCubeValue = (cubeEl, value, opts = {}) => {
    const inst = instances.get(cubeEl);
    if (!isGameDie(cubeEl) || !inst) {
      origSet(cubeEl, value, opts);
      return;
    }
    const rot = FACE_ROT[value] || FACE_ROT[1];
    if (opts.animate) {
      inst.land(value, null);
    } else {
      inst.wild = false;
      inst.anim = null;
      inst.bounce = 0;
      inst.setRot(rot.x, rot.y);
      inst.setBounce(0);
      inst.render();
    }
    cubeEl.dataset.value = String(value);
    cubeEl.dataset.rotX = String(rot.x);
    cubeEl.dataset.rotY = String(rot.y);
  };

  D.startWildRoll = (cubeEl, delayMs = 0) => {
    const inst = instances.get(cubeEl);
    if (!isGameDie(cubeEl) || !inst) {
      origWild(cubeEl, delayMs);
      return;
    }
    const run = () => {
      const scene = cubeEl.closest('.dice-scene');
      if (scene) {
        scene.classList.remove('dice-scene-landed');
        scene.classList.add('dice-scene-rolling');
      }
      inst.wild = true;
      active.add(inst);
      scheduleFrame();
    };
    if (delayMs > 0) setTimeout(run, delayMs);
    else run();
  };

  D.landCube = (cubeEl, value, onDone) => {
    const inst = instances.get(cubeEl);
    if (!isGameDie(cubeEl) || !inst) {
      origLand(cubeEl, value, onDone);
      return;
    }
    const scene = cubeEl.closest('.dice-scene');
    if (scene) scene.classList.add('dice-scene-rolling');
    inst.land(value, () => {
      const snap = FACE_ROT[value] || FACE_ROT[1];
      inst.setRot(snap.x, snap.y);
      inst.setBounce(0);
      inst.render();
      cubeEl.dataset.value = String(value);
      if (scene) {
        scene.classList.remove('dice-scene-rolling');
        scene.classList.add('dice-scene-landed');
        setTimeout(() => scene.classList.remove('dice-scene-landed'), 600);
      }
      if (onDone) onDone();
    });
    active.add(inst);
    scheduleFrame();
  };

  D._webglPatched = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patch);
} else {
  patch();
}
