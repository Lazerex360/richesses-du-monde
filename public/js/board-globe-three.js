/**
 * Planète Terre 3D au centre du plateau (mode cinématique).
 * Texture satellite + shader atmosphère Rayleigh + normal map relief.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

const CDN    = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/';
const EARTH_TEX  = CDN + 'earth-blue-marble.jpg';
const CLOUDS_TEX = CDN + 'earth-clouds.png';
const NORMAL_TEX = CDN + 'earth-topology.png';

/* ── Shader atmosphère Rayleigh ─────────────────────────────── */
const ATMOS_VERT = /* glsl */`
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMOS_FRAG = /* glsl */`
  uniform vec3  glowColor;
  uniform float power;
  varying vec3  vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
    gl_FragColor = vec4(glowColor * intensity, intensity);
  }
`;

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

  mount() {
    if (!this.host || this.renderer) return;
    try {
      const size = Math.max(this.host.clientWidth || 120, 80);
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'board-globe-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.host.appendChild(this.canvas);
      this.host.classList.add('has-webgl-globe');

      /* ── Renderer ─────────────────────────────────────────── */
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.renderer.setSize(size, size, false);
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

      /* ── Scène / caméra ───────────────────────────────────── */
      this.scene  = new THREE.Scene();
      // FOV 35° → z_min = r_atmos(1.13) / tan(17.5°) ≈ 3.6
      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
      this.camera.position.z = 3.6;

      /* ── Étoiles ──────────────────────────────────────────── */
      const starPositions = new Float32Array(3600);
      for (let i = 0; i < 3600; i++) starPositions[i] = (Math.random() - 0.5) * 40;
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06 }));
      this.scene.add(this.stars);

      /* ── Lumières ─────────────────────────────────────────── */
      const sun = new THREE.DirectionalLight(0xfff4e0, 1.35);
      sun.position.set(4, 2, 3);
      this.scene.add(sun);
      this.scene.add(new THREE.AmbientLight(0x223355, 0.40));

      /* ── Groupe Terre (inclinaison axiale 23.5°) ──────────── */
      this.earthGroup = new THREE.Group();
      this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
      this.scene.add(this.earthGroup);

      /* Globe Terre — placeholder pendant chargement */
      this.earth = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 64, 64),
        new THREE.MeshPhongMaterial({ color: 0x1a5276, emissive: 0x0d2b40, emissiveIntensity: 0.4, shininess: 18 })
      );
      this.earthGroup.add(this.earth);

      /* Nuages */
      this.clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.012, 48, 48),
        new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
      );
      this.earthGroup.add(this.clouds);

      /* ── Atmosphère Rayleigh (shader GLSL) ────────────────── */
      this.atmos = new THREE.Mesh(
        new THREE.SphereGeometry(1.13, 48, 48),
        new THREE.ShaderMaterial({
          uniforms: {
            glowColor: { value: new THREE.Color(0x4fc3f7) },
            power:     { value: 2.8 },
          },
          vertexShader:   ATMOS_VERT,
          fragmentShader: ATMOS_FRAG,
          side:       THREE.BackSide,
          blending:   THREE.AdditiveBlending,
          transparent: true,
          depthWrite:  false,
        })
      );
      this.scene.add(this.atmos); // hors du groupe — pas de rotation avec la Terre

      /* Halo doux extérieur */
      this.halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.22, 32, 32),
        new THREE.ShaderMaterial({
          uniforms: {
            glowColor: { value: new THREE.Color(0x1565c0) },
            power:     { value: 4.2 },
          },
          vertexShader:   ATMOS_VERT,
          fragmentShader: ATMOS_FRAG,
          side:       THREE.BackSide,
          blending:   THREE.AdditiveBlending,
          transparent: true,
          depthWrite:  false,
        })
      );
      this.scene.add(this.halo);

      /* ── Chargement textures ──────────────────────────────── */
      const loader = new THREE.TextureLoader();
      const loadTex = url => new Promise((res, rej) => loader.load(url, res, undefined, rej));
      const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

      Promise.all([loadTex(EARTH_TEX), loadTex(CLOUDS_TEX), loadTex(NORMAL_TEX)])
        .then(([dayTex, cloudTex, normalTex]) => {
          dayTex.colorSpace   = THREE.SRGBColorSpace;
          cloudTex.colorSpace = THREE.SRGBColorSpace;
          // Anisotropy → textures nettes à angle rasant
          dayTex.anisotropy   = maxAniso;
          cloudTex.anisotropy = maxAniso;

          this.earth.material = new THREE.MeshPhongMaterial({
            map:         dayTex,
            normalMap:   normalTex,
            normalScale: new THREE.Vector2(0.06, 0.06),
            specular:    new THREE.Color(0x226688),
            shininess:   28,
          });

          this.clouds.material = new THREE.MeshPhongMaterial({
            map: cloudTex, transparent: true, opacity: 0.45, depthWrite: false,
          });

          this.loaded = true;
        })
        .catch(() => {
          this.earth.material = new THREE.MeshPhongMaterial({ color: 0x1565c0, emissive: 0x0a2540, shininess: 20 });
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
    if (this.renderer) { this.renderer.dispose(); this.renderer = null; }
    this.canvas?.remove();
    this.canvas = null;
    this.host?.classList.remove('has-webgl-globe');
    this.loaded = false;
    this.earth = this.clouds = this.atmos = this.halo = this.stars = this.earthGroup = null;
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

      const t = performance.now() * 0.001;

      if (this.earthGroup) this.earthGroup.rotation.y = t * 0.62;   // ~10s/tour
      if (this.clouds)     this.clouds.rotation.y     = t * 0.08;   // nuages plus lents
      if (this.stars)      this.stars.rotation.y      = t * 0.004;  // ciel étoilé lent

      // Pulsation atmosphère
      if (this.atmos && this.halo) {
        const pulse = 1 + Math.sin(t * 0.9) * 0.007;
        this.atmos.scale.setScalar(pulse);
        this.halo.scale.setScalar(pulse * 1.008);
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
