/**
 * Planète Terre 3D — Globe cinématique.
 * Shader Rayleigh + texture nuit + normal map + specular océans
 * + étoiles filantes + marqueurs de richesses (pays) + bloom (halo lumineux).
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const CDN      = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/';
const EARTH_TEX  = CDN + 'earth-blue-marble.jpg';
const CLOUDS_TEX = CDN + 'earth-clouds.png';
const NORMAL_TEX = CDN + 'earth-topology.png';
const NIGHT_TEX  = CDN + 'earth-night.jpg';
const WATER_TEX  = CDN + 'earth-water.png';

/* Direction normalisée vers le soleil (world-space, fixe) */
const SUN = new THREE.Vector3(4, 2, 3).normalize();

/* ── Coordonnées (lat, lng) des régions « richesses » du plateau ── */
const RESOURCE_COUNTRIES = [
  [-28, 24],    // Afrique australe
  [0, 20],      // Afrique centrale
  [2, 38],      // Afrique est
  [8, 2],       // Afrique ouest
  [51, 10],     // Allemagne
  [7, -66],     // Amérique centrale
  [-38, -63],   // Argentine
  [13, 103],    // Asie sud
  [-25, 134],   // Australie
  [-10, -55],   // Brésil
  [56, -106],   // Canada
  [35, 103],    // Chine
  [21.5, -78],  // Cuba
  [49, 32],     // Europe est
  [41, 8],      // Europe méditerranée
  [47, 2],      // France
  [21, 78],     // Inde
  [-2, 118],    // Indonésie
  [37, 138],    // Japon
  [23, -102],   // Mexique
  [27, 48],     // Moyen-Orient
  [62, 10],     // Norvège
  [-28, 165],   // Océanie
  [-18, -72],   // Pays andins
  [28, 68],     // Péninsule indienne
  [54, -2],     // Royaume-Uni
  [62, 90],     // Russie
  [39, -98],    // USA
];

function latLngToVec3(lat, lng, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

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

/* ── Shader nuit (city lights côté sombre) ──────────────────── */
const NIGHT_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const NIGHT_FRAG = /* glsl */`
  uniform sampler2D nightMap;
  uniform vec3      sunDir;
  varying vec2      vUv;
  varying vec3      vWorldNormal;
  void main() {
    float sun       = dot(vWorldNormal, sunDir);
    float nightBlend = smoothstep(0.15, -0.25, sun);
    if (nightBlend < 0.01) discard;
    vec4  night      = texture2D(nightMap, vUv);
    float brightness = dot(night.rgb, vec3(0.3, 0.59, 0.11));
    float lights     = smoothstep(0.04, 0.30, brightness);
    gl_FragColor = vec4(night.rgb * 2.4, nightBlend * lights);
  }
`;

/* ── Shader marqueur richesse (point pulsant doré) ──────────── */
const MARKER_VERT = /* glsl */`
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const MARKER_FRAG = /* glsl */`
  uniform vec3  color;
  uniform float pulse;
  varying vec3  vNormal;
  void main() {
    float rim = pow(1.0 - abs(vNormal.z), 1.5);
    float core = 1.0 - rim;
    vec3 c = color * (0.6 + pulse * 0.6);
    gl_FragColor = vec4(c, core * 0.95 + rim * 0.25);
  }
`;

class RdmBoardGlobe {
  constructor() {
    this.enabled = false;
    this.ready   = false;
    this.raf     = 0;
    this.host    = null;
    this.visible = true;
    this._shootingStars = [];
    this._nextStarAt = 0;
    this.composer  = null;
    this.bloomPass = null;
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
      this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
      this.camera.position.z = 3.6;

      /* ── Étoiles de fond ──────────────────────────────────── */
      const starPos = new Float32Array(3600);
      for (let i = 0; i < 3600; i++) starPos[i] = (Math.random() - 0.5) * 40;
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      this.stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.06 })
      );
      this.scene.add(this.stars);

      /* ── Étoiles filantes (pool réutilisable) ─────────────── */
      this._shootingStars = [];
      for (let i = 0; i < 3; i++) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);
        this._shootingStars.push({ line, active: false, start: 0, dur: 0, pos: null, vel: null });
      }
      this._nextStarAt = performance.now() + 1500 + Math.random() * 3000;

      /* ── Lumières ─────────────────────────────────────────── */
      const sun = new THREE.DirectionalLight(0xfff4e0, 1.35);
      sun.position.copy(SUN.clone().multiplyScalar(10));
      this.scene.add(sun);
      this.scene.add(new THREE.AmbientLight(0x223355, 0.40));

      /* ── Groupe Terre (tilt axial 23.5°) ─────────────────── */
      this.earthGroup = new THREE.Group();
      this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
      this.scene.add(this.earthGroup);

      /* Placeholder globe (avant chargement textures) */
      this.earth = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 64, 64),
        new THREE.MeshPhongMaterial({
          color: 0x1a5276, emissive: 0x0d2b40,
          emissiveIntensity: 0.4, shininess: 18,
        })
      );
      this.earthGroup.add(this.earth);

      /* Nuages (opacity 0 avant chargement) */
      this.clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.012, 48, 48),
        new THREE.MeshPhongMaterial({
          color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
        })
      );
      this.earthGroup.add(this.clouds);

      /* Texture nuit — couche additive sur face sombre */
      this.nightMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.001, 64, 64),
        new THREE.ShaderMaterial({
          uniforms: {
            nightMap: { value: null },
            sunDir:   { value: SUN },
          },
          vertexShader:   NIGHT_VERT,
          fragmentShader: NIGHT_FRAG,
          blending:    THREE.AdditiveBlending,
          transparent: true,
          depthWrite:  false,
        })
      );
      this.nightMesh.visible = false;
      this.earthGroup.add(this.nightMesh);

      /* ── Marqueurs de richesses (pays) ─────────────────────── */
      this.markersGroup = new THREE.Group();
      const markerGeo = new THREE.SphereGeometry(0.015, 8, 8);
      this._markers = RESOURCE_COUNTRIES.map(([lat, lng]) => {
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(0xe8c878) },
            pulse: { value: Math.random() },
          },
          vertexShader: MARKER_VERT, fragmentShader: MARKER_FRAG,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const m = new THREE.Mesh(markerGeo, mat);
        m.position.copy(latLngToVec3(lat, lng, 1.018));
        m.userData.phase = Math.random() * Math.PI * 2;
        this.markersGroup.add(m);
        return m;
      });
      this.earthGroup.add(this.markersGroup);

      /* ── Atmosphère Rayleigh ──────────────────────────────── */
      this.atmos = new THREE.Mesh(
        new THREE.SphereGeometry(1.13, 48, 48),
        new THREE.ShaderMaterial({
          uniforms: {
            glowColor: { value: new THREE.Color(0x4fc3f7) },
            power:     { value: 2.8 },
          },
          vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG,
          side: THREE.BackSide, blending: THREE.AdditiveBlending,
          transparent: true, depthWrite: false,
        })
      );
      this.scene.add(this.atmos);

      /* Halo extérieur */
      this.halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.22, 32, 32),
        new THREE.ShaderMaterial({
          uniforms: {
            glowColor: { value: new THREE.Color(0x1565c0) },
            power:     { value: 4.2 },
          },
          vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG,
          side: THREE.BackSide, blending: THREE.AdditiveBlending,
          transparent: true, depthWrite: false,
        })
      );
      this.scene.add(this.halo);

      /* ── Chargement textures ──────────────────────────────── */
      const loader   = new THREE.TextureLoader();
      const loadTex  = url => new Promise((ok, ko) => loader.load(url, ok, undefined, ko));
      const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

      Promise.all([
        loadTex(EARTH_TEX),
        loadTex(CLOUDS_TEX),
        loadTex(NORMAL_TEX),
        loadTex(NIGHT_TEX),
        loadTex(WATER_TEX),
      ]).then(([dayTex, cloudTex, normalTex, nightTex, waterTex]) => {
        dayTex.colorSpace   = THREE.SRGBColorSpace;
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        nightTex.colorSpace = THREE.SRGBColorSpace;
        dayTex.anisotropy   = maxAniso;
        cloudTex.anisotropy = maxAniso;
        nightTex.anisotropy = maxAniso;
        waterTex.anisotropy = maxAniso;

        this.earth.material = new THREE.MeshPhongMaterial({
          map:         dayTex,
          normalMap:   normalTex,
          normalScale: new THREE.Vector2(0.06, 0.06),
          specularMap: waterTex,          // blanc = océan brillant, noir = terre mate
          specular:    new THREE.Color(0x4488aa),
          shininess:   38,
        });

        this.clouds.material = new THREE.MeshPhongMaterial({
          map: cloudTex, transparent: true, opacity: 0.45, depthWrite: false,
        });

        this.nightMesh.material.uniforms.nightMap.value = nightTex;
        this.nightMesh.visible = true;
      }).catch(() => {
        this.earth.material = new THREE.MeshPhongMaterial({
          color: 0x1565c0, emissive: 0x0a2540, shininess: 20,
        });
      });

      /* ── Post-processing : halo lumineux (Bloom) ──────────── */
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(size, size), 0.5, 0.55, 0.8);
      this.composer.addPass(this.bloomPass);
      this.composer.setSize(size, size);

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
      if (this.composer) this.composer.setSize(s, s);
    });
    ro.observe(this.host);
    this._ro = ro;
  }

  /* ── Étoile filante : (re)lance une ligne du pool ─────────── */
  _fireShootingStar(star, now) {
    const r = 16;
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    star.pos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      Math.abs(r * Math.cos(phi)) * 0.6 + 4, // privilégie le haut du champ
      r * Math.sin(phi) * Math.sin(theta)
    );
    star.vel = new THREE.Vector3((Math.random() - 0.5) * 2, -(0.6 + Math.random()), (Math.random() - 0.5) * 2).normalize();
    star.active = true;
    star.start  = now;
    star.dur    = 700 + Math.random() * 500;
  }

  _updateShootingStars(now) {
    if (now >= this._nextStarAt) {
      const free = this._shootingStars.find(s => !s.active);
      if (free) this._fireShootingStar(free, now);
      this._nextStarAt = now + 4000 + Math.random() * 6000;
    }
    for (const s of this._shootingStars) {
      if (!s.active) continue;
      const elapsed = now - s.start;
      const progress = elapsed / s.dur;
      if (progress >= 1) {
        s.active = false;
        s.line.material.opacity = 0;
        continue;
      }
      const head = s.pos.clone().add(s.vel.clone().multiplyScalar(elapsed * 0.012));
      const tail = head.clone().add(s.vel.clone().multiplyScalar(-1.4));
      const arr = s.line.geometry.attributes.position.array;
      arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
      arr[3] = tail.x; arr[4] = tail.y; arr[5] = tail.z;
      s.line.geometry.attributes.position.needsUpdate = true;
      const fade = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
      s.line.material.opacity = Math.max(0, fade) * 0.85;
    }
  }

  unmount() {
    this.stop();
    this._ro?.disconnect();
    if (this.composer) { this.composer.dispose(); this.composer = null; }
    this.bloomPass = null;
    if (this.renderer) { this.renderer.dispose(); this.renderer = null; }
    this.canvas?.remove();
    this.canvas = null;
    this.host?.classList.remove('has-webgl-globe');
    this.earth = this.clouds = this.nightMesh = null;
    this.atmos = this.halo  = this.stars = this.earthGroup = null;
    this.markersGroup = null; this._markers = [];
    this._shootingStars = [];
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

      const now = performance.now();
      const t = now * 0.001;

      if (this.earthGroup) this.earthGroup.rotation.y = t * 0.62;
      if (this.clouds)     this.clouds.rotation.y     = t * 0.08;
      if (this.stars)      this.stars.rotation.y      = t * 0.004;

      if (this.atmos && this.halo) {
        const pulse = 1 + Math.sin(t * 0.9) * 0.007;
        this.atmos.scale.setScalar(pulse);
        this.halo.scale.setScalar(pulse * 1.008);
      }

      /* Pulsation des marqueurs de richesses */
      if (this._markers) {
        for (const m of this._markers) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + m.userData.phase);
          m.material.uniforms.pulse.value = pulse;
          const s = 1 + pulse * 0.6;
          m.scale.setScalar(s);
        }
      }

      this._updateShootingStars(now);

      /* Resize dynamique */
      const s = this.host.clientWidth || 120;
      const dpr = this.renderer.getPixelRatio();
      if (this.renderer.domElement.width !== Math.floor(s * dpr)) {
        this.renderer.setSize(s, s, false);
        if (this.composer) this.composer.setSize(s, s);
      }

      if (this.composer) this.composer.render();
      else this.renderer.render(this.scene, this.camera);
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
