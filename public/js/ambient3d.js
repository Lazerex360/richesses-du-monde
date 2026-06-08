/**
 * Fond 3D cinématique — étoiles, globe, anneau, particules, bloom.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const MODES = {
  auth: { stars: 1, globe: 1, bloom: 0.55, speed: 1 },
  hub: { stars: 0.88, globe: 0.82, bloom: 0.45, speed: 0.88 },
  game: { stars: 0.5, globe: 0.28, bloom: 0.22, speed: 0.45 },
  lobby: { stars: 0.72, globe: 0.58, bloom: 0.34, speed: 0.68 },
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
    this.burstT = 0;
    this.celebrateT = 0;
    this.clock = new THREE.Clock();
    this.lowPower = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) < 4;
  }

  init() {
    if (this.ready) return;
    this.reduceMotion = document.body.classList.contains('reduce-motion');

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'rdm-ambient-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(this.canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.25 : 1.75);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: !this.lowPower });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0.15, 5.6);

    const starCount = this.lowPower ? 1200 : 2600;
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const r = 9 + Math.random() * 20;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p) - 5;
      const tint = 0.55 + Math.random() * 0.45;
      col[i * 3] = tint * 0.75;
      col[i * 3 + 1] = tint * 0.85;
      col[i * 3 + 2] = tint;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 0.042, vertexColors: true, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.scene.add(this.stars);

    this.globe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.12, 2),
      new THREE.MeshStandardMaterial({
        color: 0xc9a04a, emissive: 0x4a3810, emissiveIntensity: 0.45,
        metalness: 0.75, roughness: 0.28, wireframe: true, transparent: true, opacity: 0.52,
      }),
    );
    this.globeCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1b4332, emissive: 0x2d6a4f, emissiveIntensity: 0.55,
        metalness: 0.15, roughness: 0.5,
      }),
    );
    this.globe.add(this.globeCore);
    this.scene.add(this.globe);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.022, 10, 128),
      new THREE.MeshStandardMaterial({
        color: 0xe8c878, emissive: 0xc9a04a, emissiveIntensity: 1,
        metalness: 0.9, roughness: 0.15, transparent: true, opacity: 0.8,
      }),
    );
    this.ring.rotation.x = Math.PI * 0.36;
    this.scene.add(this.ring);

    const dustCount = this.lowPower ? 80 : 160;
    const dustGeo = new THREE.BufferGeometry();
    const dpos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 2.2;
      dpos[i * 3] = Math.cos(a) * r;
      dpos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      dpos[i * 3 + 2] = Math.sin(a) * r;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size: 0.055, color: 0xffe8a0, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.scene.add(this.dust);

    this.scene.add(new THREE.AmbientLight(0x8fa4c4, 0.38));
    const key = new THREE.DirectionalLight(0xffe8b0, 1.15);
    key.position.set(2.5, 3.5, 4);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x3dd68c, 0.55, 14);
    rim.position.set(-2.5, -0.5, 3);
    this.scene.add(rim);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.38, 0.84);
    this.composer.addPass(this.bloomPass);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden;
      if (!this.visible) this.stop();
      else if (this.mode !== 'off') this.start();
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

  setReduceMotion(on) {
    this.reduceMotion = !!on;
    if (this.reduceMotion) this.stop();
    else if (this.mode !== 'off') this.start();
  }

  pulse() {
    this.burstT = 0.85;
  }

  celebrate() {
    this.celebrateT = 2.8;
    this.burstT = 1.2;
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
      const k = Math.min(1, dt * 2.4);
      for (const key of ['stars', 'globe', 'bloom', 'speed']) {
        this.current[key] += (this.target[key] - this.current[key]) * k;
      }
      const s = this.current.speed;
      const burst = Math.max(0, this.burstT);
      const celeb = Math.max(0, this.celebrateT);
      if (burst > 0) this.burstT = Math.max(0, this.burstT - dt * 1.4);
      if (celeb > 0) this.celebrateT = Math.max(0, this.celebrateT - dt);

      this.stars.rotation.y = t * 0.022 * s;
      this.stars.rotation.x = Math.sin(t * 0.07) * 0.05;
      this.stars.material.opacity = 0.18 + this.current.stars * 0.72 + burst * 0.15;

      this.globe.rotation.y = t * 0.28 * s * (1 + burst * 0.4);
      this.globe.rotation.x = Math.sin(t * 0.32) * 0.1;
      const gScale = 0.28 + this.current.globe * 0.9 + burst * 0.12 + celeb * 0.08;
      this.globe.scale.setScalar(gScale);
      this.globe.material.opacity = 0.12 + this.current.globe * 0.48 + burst * 0.1;

      this.ring.rotation.z = t * 0.48 * s;
      this.ring.rotation.y = Math.sin(t * 0.2) * 0.15;
      this.ring.scale.setScalar(0.38 + this.current.globe * 0.85 + burst * 0.1);

      if (this.dust) {
        this.dust.rotation.y = -t * 0.08 * s;
        this.dust.material.opacity = 0.2 + this.current.globe * 0.45 + burst * 0.35;
      }

      const bloomBase = 0.1 + this.current.bloom * 0.75;
      this.bloomPass.strength = bloomBase + burst * 0.55 + celeb * 0.35;
      this.camera.position.x = Math.sin(t * 0.13 * s) * (0.12 + burst * 0.08);
      this.camera.position.y = 0.12 + Math.cos(t * 0.1) * 0.1;
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
