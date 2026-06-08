/**
 * Mini-globe Three.js au centre du plateau (mode cinématique).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

class RdmBoardGlobe {
  constructor() {
    this.enabled = false;
    this.ready = false;
    this.raf = 0;
    this.host = null;
    this.visible = true;
  }

  init() {
    if (this.ready) return;
    this.host = document.querySelector('.board-globe-3d');
    if (!this.host) return;
    this.ready = true;
    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden;
      if (!this.visible) this.stop();
      else if (this.enabled) this.start();
    });
  }

  mount() {
    if (!this.host || this.renderer) return;
    try {
      const size = Math.max(this.host.clientWidth || 48, 32);
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'board-globe-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.host.appendChild(this.canvas);
      this.host.classList.add('has-webgl-globe');

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.renderer.setSize(size, size, false);
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10);
      this.camera.position.z = 2.4;

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0x1b4332, emissive: 0x2d6a4f, emissiveIntensity: 0.5,
          metalness: 0.2, roughness: 0.55,
        }),
      );
      const wire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.88, 2),
        new THREE.MeshStandardMaterial({
          color: 0xc9a04a, emissive: 0x6a5520, emissiveIntensity: 0.35,
          wireframe: true, transparent: true, opacity: 0.55,
        }),
      );
      this.globe = new THREE.Group();
      this.globe.add(earth, wire);
      this.scene.add(this.globe);

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const dl = new THREE.DirectionalLight(0xffe8b0, 1);
      dl.position.set(2, 2, 3);
      this.scene.add(dl);
    } catch (_) {
      this.unmount();
    }
  }

  unmount() {
    this.stop();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.canvas?.remove();
    this.canvas = null;
    this.host?.classList.remove('has-webgl-globe');
  }

  setEnabled(on) {
    this.init();
    this.enabled = !!on && window.RdmCinematic?.isActive?.();
    if (!this.enabled) {
      this.unmount();
      return;
    }
    this.mount();
    this.start();
  }

  start() {
    if (this.raf || !this.enabled || !this.renderer) return;
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      const gameOn = document.querySelector('#screen-game')?.classList.contains('active');
      if (!this.visible || !this.enabled || !gameOn) return;
      const diceVisible = !document.querySelector('#dice-area')?.classList.contains('hidden');
      const mainHidden = diceVisible;
      this.host.style.opacity = mainHidden ? '0' : '1';
      if (mainHidden) return;
      const t = performance.now() * 0.001;
      this.globe.rotation.y = t * 0.55;
      this.globe.rotation.x = 0.35;
      const s = this.host.clientWidth || 48;
      if (this.renderer.domElement.width !== Math.floor(s * this.renderer.getPixelRatio())) {
        this.renderer.setSize(s, s, false);
      }
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

const boardGlobe = new RdmBoardGlobe();
window.RdmBoardGlobe = boardGlobe;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => boardGlobe.init());
} else {
  boardGlobe.init();
}
