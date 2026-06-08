/**
 * Fond 3D cinématique — étoiles, globe doré, bloom.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const MODES = {
  auth: { stars: 1, globe: 1, bloom: 0.5, speed: 1 },
  hub: { stars: 0.85, globe: 0.8, bloom: 0.4, speed: 0.85 },
  game: { stars: 0.55, globe: 0.3, bloom: 0.25, speed: 0.5 },
  lobby: { stars: 0.7, globe: 0.55, bloom: 0.32, speed: 0.65 },
  off: { stars: 0, globe: 0, bloom: 0, speed: 0 },
};

class RdmAmbient3D {
  constructor() {
    this.mode = 'off';
    this.target = { ...MODES.off };
    this.current = { ...MODES.off };
    this.ready = false;
    this.raf = 0;
    this.visible = true;
    this.reduceMotion = false;
    this.clock = new THREE.Clock();
  }

  init() {
    if (this.ready) return;
    this.reduceMotion = document.body.classList.contains('reduce-motion');

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'rdm-ambient-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    this.camera.position.z = 5.5;

    const starGeo = new THREE.BufferGeometry();
    const count = 2200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 10 + Math.random() * 18;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p) - 5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 0.04, color: 0xb8d4ff, transparent: true, opacity: 0.8, depthWrite: false,
    }));
    this.scene.add(this.stars);

    this.globe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 2),
      new THREE.MeshStandardMaterial({
        color: 0xc9a04a, emissive: 0x3d2e10, emissiveIntensity: 0.4,
        metalness: 0.7, roughness: 0.3, wireframe: true, transparent: true, opacity: 0.5,
      }),
    );
    this.scene.add(this.globe);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.02, 8, 96),
      new THREE.MeshStandardMaterial({
        color: 0xe8c878, emissive: 0xc9a04a, emissiveIntensity: 0.9, metalness: 0.85, roughness: 0.2,
      }),
    );
    this.ring.rotation.x = Math.PI * 0.35;
    this.scene.add(this.ring);

    this.scene.add(new THREE.AmbientLight(0x8fa4c4, 0.4));
    const key = new THREE.DirectionalLight(0xffe8b0, 1);
    key.position.set(2, 3, 4);
    this.scene.add(key);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.35, 0.85);
    this.composer.addPass(this.bloomPass);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden;
      if (this.visible && this.mode !== 'off') this.start();
    });

    this.ready = true;
    this.setMode('auth');
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
  }

  setMode(mode) {
    this.mode = MODES[mode] ? mode : 'off';
    this.target = { ...MODES[this.mode] };
    document.body.classList.toggle('rdm-ambient-on', this.mode !== 'off');
    if (this.mode === 'off') {
      this.stop();
      if (this.canvas) this.canvas.style.opacity = '0';
      return;
    }
    if (this.canvas) this.canvas.style.opacity = '1';
    this.start();
  }

  start() {
    if (this.raf || this.reduceMotion) return;
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (!this.visible || this.mode === 'off') return;
      const t = this.clock.getElapsedTime();
      const dt = this.clock.getDelta();
      const k = Math.min(1, dt * 2);
      for (const key of ['stars', 'globe', 'bloom', 'speed']) {
        this.current[key] += (this.target[key] - this.current[key]) * k;
      }
      const s = this.current.speed;
      this.stars.rotation.y = t * 0.02 * s;
      this.stars.material.opacity = 0.2 + this.current.stars * 0.65;
      this.globe.rotation.y = t * 0.25 * s;
      this.globe.scale.setScalar(0.3 + this.current.globe * 0.85);
      this.globe.material.opacity = 0.15 + this.current.globe * 0.45;
      this.ring.rotation.z = t * 0.4 * s;
      this.ring.scale.setScalar(0.4 + this.current.globe * 0.8);
      this.bloomPass.strength = 0.12 + this.current.bloom * 0.7;
      this.camera.position.x = Math.sin(t * 0.12) * 0.15;
      this.composer.render();
    };
    tick();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

const ambient = new RdmAmbient3D();
window.RdmAmbient3D = ambient;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ambient.init());
} else {
  ambient.init();
}
