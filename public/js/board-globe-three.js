/**
 * Planète Terre 3D au centre du plateau (mode cinématique).
 * Texture satellite chargée depuis jsDelivr (three-globe npm package).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

const EARTH_TEX   = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';
const CLOUDS_TEX  = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds.png';
const NIGHT_TEX   = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';

class RdmBoardGlobe {
  constructor() {
    this.enabled  = false;
    this.ready    = false;
    this.raf      = 0;
    this.host     = null;
    this.visible  = true;
    this.loaded   = false;
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

  _makeEarthMaterial(dayTex) {
    return new THREE.MeshPhongMaterial({
      map:           dayTex,
      specular:      new THREE.Color(0x4488aa),
      specularMap:   null,
      shininess:     22,
      bumpScale:     0.003,
    });
  }

  mount() {
    if (!this.host || this.renderer) return;
    try {
      const size = Math.max(this.host.clientWidth || 120, 80);
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'board-globe-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.host.appendChild(this.canvas);
      this.host.classList.add('has-webgl-globe');

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.renderer.setSize(size, size, false);
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = false;

      this.scene  = new THREE.Scene();
      // FOV 35°, demi-frustum à z=0 : tan(17.5°)*z = r_atmos(1.13) → z ≈ 3.6
      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
      this.camera.position.z = 3.6;

      // Lumière solaire
      const sun = new THREE.DirectionalLight(0xfff4e0, 1.35);
      sun.position.set(4, 2, 3);
      this.scene.add(sun);
      this.scene.add(new THREE.AmbientLight(0x333355, 0.45));

      // Groupe principal
      this.earthGroup = new THREE.Group();
      this.scene.add(this.earthGroup);

      // --- Sphère Terre (placeholder vert pendant le chargement) ---
      const earthGeo = new THREE.SphereGeometry(1, 48, 48);
      const placeholderMat = new THREE.MeshPhongMaterial({
        color: 0x1a5276, emissive: 0x0d2b40, emissiveIntensity: 0.4,
        shininess: 18,
      });
      this.earth = new THREE.Mesh(earthGeo, placeholderMat);
      this.earthGroup.add(this.earth);

      // --- Nuages (transparent, rotation plus lente) ---
      const cloudGeo = new THREE.SphereGeometry(1.012, 48, 48);
      const cloudMat = new THREE.MeshPhongMaterial({
        color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
      });
      this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
      this.earthGroup.add(this.clouds);

      // --- Atmosphère (glow extérieur) ---
      const atmosGeo = new THREE.SphereGeometry(1.055, 32, 32);
      const atmosMat = new THREE.MeshPhongMaterial({
        color: 0x4fc3f7, transparent: true, opacity: 0.10,
        depthWrite: false, side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
      });
      this.atmos = new THREE.Mesh(atmosGeo, atmosMat);
      this.scene.add(this.atmos); // hors du groupe — pas de rotation

      // Halo externe encore plus doux
      const haloGeo = new THREE.SphereGeometry(1.13, 32, 32);
      const haloMat = new THREE.MeshPhongMaterial({
        color: 0x2196f3, transparent: true, opacity: 0.045,
        depthWrite: false, side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
      });
      this.halo = new THREE.Mesh(haloGeo, haloMat);
      this.scene.add(this.halo);

      // Légère inclinaison axiale (23.5° comme la vraie Terre)
      this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);

      // Chargement textures
      const loader = new THREE.TextureLoader();
      const loadTex = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

      Promise.all([loadTex(EARTH_TEX), loadTex(CLOUDS_TEX)]).then(([dayTex, cloudTex]) => {
        dayTex.colorSpace = THREE.SRGBColorSpace;
        cloudTex.colorSpace = THREE.SRGBColorSpace;

        this.earth.material = new THREE.MeshPhongMaterial({
          map:       dayTex,
          specular:  new THREE.Color(0x226688),
          shininess: 25,
        });

        this.clouds.material = new THREE.MeshPhongMaterial({
          map: cloudTex, transparent: true, opacity: 0.42,
          depthWrite: false, blending: THREE.NormalBlending,
        });

        this.loaded = true;
      }).catch(() => {
        // Fallback si CDN injoignable : style procédural
        this.earth.material = new THREE.MeshPhongMaterial({
          color: 0x1565c0, emissive: 0x0a2540, shininess: 20,
        });
        this.loaded = true;
      });

      this._startResize();
    } catch (_) {
      this.unmount();
    }
  }

  _startResize() {
    const ro = new ResizeObserver(() => {
      if (!this.renderer || !this.host) return;
      const s = Math.max(this.host.clientWidth || 120, 80);
      this.renderer.setSize(s, s, false);
    });
    ro.observe(this.host);
    this._ro = ro;
  }

  unmount() {
    this.stop();
    this._ro?.disconnect();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.canvas?.remove();
    this.canvas = null;
    this.host?.classList.remove('has-webgl-globe');
    this.loaded = false;
    this.earth = null;
    this.clouds = null;
    this.atmos = null;
    this.halo = null;
    this.earthGroup = null;
  }

  setEnabled(on) {
    this.init();
    this.enabled = !!on && window.RdmCinematic?.isActive?.();
    if (!this.enabled) { this.unmount(); return; }
    this.mount();
    this.start();
  }

  start() {
    if (this.raf || !this.enabled || !this.renderer) return;
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      const gameOn = document.querySelector('#screen-game')?.classList.contains('active');
      if (!this.visible || !this.enabled || !gameOn) return;

      // La planète reste toujours visible (CSS réduit sa taille quand les dés s'affichent)

      const t = performance.now() * 0.001;

      // Rotation Terre (environ 10s par tour)
      if (this.earthGroup) {
        this.earthGroup.rotation.y = t * 0.62;
      }
      // Nuages tournent un tout petit peu plus vite (effet atmosphère)
      if (this.clouds) {
        this.clouds.rotation.y = t * 0.08;
      }
      // Légère pulsation de l'atmosphère
      if (this.atmos && this.halo) {
        const pulse = 1 + Math.sin(t * 0.9) * 0.008;
        this.atmos.scale.setScalar(pulse);
        this.halo.scale.setScalar(pulse * 1.01);
      }

      // Resize si nécessaire
      const s = this.host.clientWidth || 120;
      const dpr = this.renderer.getPixelRatio();
      if (this.renderer.domElement.width !== Math.floor(s * dpr)) {
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
