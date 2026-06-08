/**
 * Dés WebGL Three.js — remplace le rendu CSS pour #die1 / #die2.
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

const instances = new WeakMap();
const active = new Set();
let raf = 0;

function pipTexture(val, bg, pip) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = pip;
  const r = 9;
  (PIP_POS[val] || PIP_POS[1]).forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px * 128, py * 128, r, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMaterials(bg, pip) {
  const order = [1, 2, 3, 4, 5, 6];
  return order.map((v) => new THREE.MeshPhysicalMaterial({
    map: pipTexture(v, bg, pip),
    metalness: 0.12, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.25,
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
  const sceneEl = cubeEl.closest('.dice-scene');
  if (!sceneEl) return null;

  const w = sceneEl.clientWidth || 48;
  const h = sceneEl.clientHeight || 48;
  const canvas = document.createElement('canvas');
  canvas.className = 'dice-webgl-canvas';
  sceneEl.classList.add('dice-scene--webgl');
  sceneEl.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 20);
  camera.position.set(0, 0.2, 2.6);

  const bg = sceneEl.style.getPropertyValue('--dice-bg') || '#f8f8f8';
  const pip = sceneEl.style.getPropertyValue('--dice-pip') || '#1a1a2e';
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.92, 0.92, 6, 0.1), makeMaterials(bg, pip));
  scene.add(mesh);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dl = new THREE.DirectionalLight(0xfff0d0, 1.1);
  dl.position.set(2, 3, 4);
  scene.add(dl);
  const pl = new THREE.PointLight(0xc9a04a, 0.5, 8);
  pl.position.set(-1, 1, 2);
  scene.add(pl);

  const inst = {
    cubeEl, sceneEl, renderer, scene, camera, mesh,
    rx: 0, ry: 0, wild: false, anim: null,
    updateSkin(bgC, pipC) {
      mesh.material = makeMaterials(bgC, pipC);
    },
    setRot(x, y) {
      this.rx = x; this.ry = y;
      mesh.rotation.x = THREE.MathUtils.degToRad(x);
      mesh.rotation.y = THREE.MathUtils.degToRad(y);
    },
    step(now) {
      if (this.wild) {
        this.rx += 18 + Math.random() * 8;
        this.ry += 22 + Math.random() * 10;
        this.setRot(this.rx, this.ry);
        return true;
      }
      if (this.anim) {
        const p = Math.min(1, (now - this.anim.t0) / this.anim.dur);
        const e = 1 - Math.pow(1 - p, 3);
        this.setRot(
          this.anim.sx + (this.anim.ex - this.anim.sx) * e,
          this.anim.sy + (this.anim.ey - this.anim.sy) * e,
        );
        if (p >= 1) {
          this.setRot(this.anim.ex, this.anim.ey);
          const cb = this.anim.done;
          this.anim = null;
          active.delete(this);
          if (cb) cb();
          return false;
        }
        return true;
      }
      return false;
    },
    render() {
      const sw = this.sceneEl.clientWidth || 48;
      const sh = this.sceneEl.clientHeight || 48;
      if (renderer.domElement.width !== Math.floor(sw * renderer.getPixelRatio())) {
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
}

function getInst(cubeEl) {
  if (!isGameDie(cubeEl)) return null;
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
    if (!isGameDie(cubeEl) || !instances.has(cubeEl)) {
      origSet(cubeEl, value, opts);
      return;
    }
    const inst = instances.get(cubeEl);
    const rot = FACE_ROT[value] || FACE_ROT[1];
    if (opts.animate) {
      inst.land(value, null);
    } else {
      inst.wild = false;
      inst.anim = null;
      inst.setRot(rot.x, rot.y);
      inst.render();
    }
    cubeEl.dataset.value = String(value);
    cubeEl.dataset.rotX = String(rot.x);
    cubeEl.dataset.rotY = String(rot.y);
  };

  D.startWildRoll = (cubeEl, delayMs = 0) => {
    if (!isGameDie(cubeEl) || !instances.has(cubeEl)) {
      origWild(cubeEl, delayMs);
      return;
    }
    const run = () => {
      const inst = instances.get(cubeEl);
      const scene = cubeEl.closest('.dice-scene');
      if (scene) scene.classList.remove('dice-scene-landed');
      inst.wild = true;
      active.add(inst);
      scheduleFrame();
    };
    if (delayMs > 0) setTimeout(run, delayMs);
    else run();
  };

  D.landCube = (cubeEl, value, onDone) => {
    if (!isGameDie(cubeEl) || !instances.has(cubeEl)) {
      origLand(cubeEl, value, onDone);
      return;
    }
    const scene = cubeEl.closest('.dice-scene');
    if (scene) scene.classList.add('dice-scene-rolling');
    const inst = instances.get(cubeEl);
    inst.land(value, () => {
      const snap = FACE_ROT[value] || FACE_ROT[1];
      inst.setRot(snap.x, snap.y);
      inst.render();
      cubeEl.dataset.value = String(value);
      if (scene) {
        scene.classList.remove('dice-scene-rolling');
        scene.classList.add('dice-scene-landed');
        setTimeout(() => scene.classList.remove('dice-scene-landed'), 520);
      }
      if (onDone) onDone();
    });
  };

  D._webglPatched = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patch);
} else {
  patch();
}
