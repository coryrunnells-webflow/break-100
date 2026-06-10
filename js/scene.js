// NINETY-NINE — engraved 3D hole (Three.js)
// One procedural scene shared by the hero and the pinned flyover.

import * as THREE from 'three';

const PINE = new THREE.Color('#0A211A');
const NIGHT = new THREE.Color('#050F0C');
const CREAM = new THREE.Color('#F3EDDF');
const GOLD = new THREE.Color('#C8A45C');
const CARDINAL = new THREE.Color('#8C2F28');

// hole routing in the xz plane (z+ = tee end, z- = green end)
const FAIRWAY = [
  new THREE.Vector2(0, 270),    // tee
  new THREE.Vector2(10, 160),
  new THREE.Vector2(28, 60),    // dogleg landing
  new THREE.Vector2(0, -90),
  new THREE.Vector2(-20, -240), // green
];
const WATER = { x: 30, z: -28, rx: 26, rz: 20 };
const GREEN = { x: -20, z: -240, r: 17 };
const TEE = new THREE.Vector3(0, 0, 262);

const NOISE_GLSL = /* glsl */`
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;

const TERRAIN_VERT = /* glsl */`
uniform vec2 uSpline[5];
uniform vec3 uWater;   // x, z, unused
uniform vec2 uWaterR;  // rx, rz
uniform vec3 uGreen;   // x, z, r
varying float vElev;
varying float vMask;
varying float vWater;
varying float vGreenD;
varying float vViewZ;
varying vec2 vPos;
${NOISE_GLSL}

float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main(){
  vec2 p = position.xz;
  vPos = p;

  // fairway corridor mask: 1 on fairway, 0 in the rough
  float d = 1e6;
  for (int i = 0; i < 4; i++) d = min(d, segDist(p, uSpline[i], uSpline[i+1]));
  float mask = 1.0 - smoothstep(16.0, 42.0, d);
  vMask = mask;

  // water mask (elliptical)
  vec2 wq = vec2((p.x - uWater.x) / uWaterR.x, (p.y - uWater.z) / uWaterR.y);
  float wd = length(wq);
  float water = 1.0 - smoothstep(0.86, 1.08, wd);
  vWater = water;

  // green: flat disc
  float gd = distance(p, uGreen.xy);
  vGreenD = gd;
  float green = 1.0 - smoothstep(uGreen.z, uGreen.z + 9.0, gd);

  // 3 octaves of rolling ground, calmed on the fairway, dead flat on green/water
  float amp = mix(1.0, 0.12, mask);
  float h = snoise(p * 0.012) * 6.0 + snoise(p * 0.03) * 2.5 + snoise(p * 0.085) * 1.0;
  h *= amp;
  h = mix(h, 0.4, green);
  h = mix(h, -1.6, water);

  vElev = h;
  vec4 mv = modelViewMatrix * vec4(position.x, h, position.z, 1.0);
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const TERRAIN_FRAG = /* glsl */`
precision highp float;
uniform float uDusk;
uniform vec3 uBg;
uniform float uFogDensity;
uniform vec3 uGold;
uniform vec3 uHaze;
uniform vec3 uGreen;
varying float vElev;
varying float vMask;
varying float vWater;
varying float vGreenD;
varying float vViewZ;
varying vec2 vPos;

void main(){
  // engraved topo isolines — screen-space hairlines via fwidth
  float e = vElev * 1.4;
  float w = fwidth(e);
  float band = abs(fract(e) - 0.5);
  float hw = w * 1.1;
  float line = 1.0 - smoothstep(hw, hw + w, band);
  // fade lines out where they'd alias into moiré (far field)
  line *= 1.0 - smoothstep(0.3, 0.75, w);

  float bright = mix(0.85, 0.22, 1.0 - vMask);     // gold on fairway, faint off it
  bright *= (1.0 - 0.35 * uDusk);
  vec3 lineCol = mix(uHaze, uGold, vMask);

  vec3 col = uBg;
  col = mix(col, lineCol, line * bright);

  // water: a darker pool with sparse engraved hatching, not a bright plate
  if (vWater > 0.02) {
    float hatch = step(0.88, fract((gl_FragCoord.x + gl_FragCoord.y) * 0.09));
    vec3 waterCol = mix(uBg, vec3(0.07, 0.14, 0.13), 0.65);
    col = mix(col, waterCol, vWater * 0.6);
    col = mix(col, uGold * 0.45, hatch * vWater * 0.4);
  }

  // green ring + cup dot — engraved hairline, sized in screen space
  float ringD = abs(vGreenD - 16.0);
  float rw = fwidth(vGreenD) * 1.4;
  float ring = 1.0 - smoothstep(rw, rw * 2.4, ringD);
  col = mix(col, uGold, ring * 0.9 * (1.0 - 0.3 * uDusk));
  float cup = 1.0 - smoothstep(1.2, 2.0, vGreenD);
  col = mix(col, vec3(0.02), cup);

  // manual exp2 fog into the page background
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * vViewZ * vViewZ);
  col = mix(col, uBg, clamp(fog, 0.0, 1.0));

  // fade the plate edges away
  float edge = smoothstep(86.0, 108.0, abs(vPos.x)) + smoothstep(280.0, 318.0, abs(vPos.y));
  col = mix(col, uBg, clamp(edge, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

function ballisticPoints(from, to, apex, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = THREE.MathUtils.lerp(from.x, to.x, t);
    const z = THREE.MathUtils.lerp(from.z, to.z, t);
    const y = THREE.MathUtils.lerp(from.y, to.y, t) + Math.sin(t * Math.PI) * apex;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

function makeTube(points, color, radius = 0.8) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 80, radius, 8, false);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.totalIndex = geo.index.count;
  mesh.geometry.setDrawRange(0, 0);
  return mesh;
}

function dimpleBumpMap() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, c.width, c.height);
  // snap spacing to integer divisions of the canvas so the texture tiles seamlessly
  const r = 13;
  const cols = Math.round(c.width / (r * 2.1));
  const rows = Math.round(c.height / (r * 1.82));
  const dx = c.width / cols, dy = c.height / rows;
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const x = col * dx + (row % 2 ? dx / 2 : 0);
      const y = row * dy;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#3a3a3a');
      g.addColorStop(0.75, '#6f6f6f');
      g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class HoleScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = true;
    this.flyProgress = 0;     // 0..1 along the camera path
    this.heroBlend = 1;       // 1 = hero idle pose, 0 = fully on the fly path
    this.dusk = 0;
    this.pointer = { x: 0, y: 0 };
    this._pointerSmooth = { x: 0, y: 0 };
    this.routeProgress = { red: 0, g1: 0, g2: 0, g3: 0 };
    this.clock = new THREE.Clock();
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._needsRender = true;

    this._build();
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _build() {
    const isMobile = window.innerWidth < 760;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    this.renderer.setClearColor(PINE.clone());

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1200);

    // --- terrain ---
    const seg = isMobile ? [128, 256] : [220, 440];
    const geo = new THREE.PlaneGeometry(220, 640, seg[0], seg[1]);
    geo.rotateX(-Math.PI / 2);
    this.terrainUniforms = {
      uSpline: { value: FAIRWAY },
      uWater: { value: new THREE.Vector3(WATER.x, 0, WATER.z) },
      uWaterR: { value: new THREE.Vector2(WATER.rx, WATER.rz) },
      uGreen: { value: new THREE.Vector3(GREEN.x, GREEN.z, GREEN.r) },
      uDusk: { value: 0 },
      uBg: { value: PINE.clone() },
      uFogDensity: { value: 0.0035 },
      uGold: { value: GOLD },
      uHaze: { value: new THREE.Color('#42594A') },
    };
    const tmat = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_VERT,
      fragmentShader: TERRAIN_FRAG,
      uniforms: this.terrainUniforms,
    });
    this.scene.add(new THREE.Mesh(geo, tmat));

    // --- lights (for the ball) ---
    this.sun = new THREE.DirectionalLight('#E8D9B0', 2.2);
    this.sun.position.set(-60, 40, 80);
    this.scene.add(this.sun);
    this.scene.add(new THREE.AmbientLight('#1C3A2E', 2.2));

    // --- the ball ---
    const ballGeo = new THREE.SphereGeometry(5, 64, 64);
    const ballMat = new THREE.MeshStandardMaterial({
      color: CREAM, roughness: 0.38, metalness: 0,
      bumpMap: dimpleBumpMap(), bumpScale: 1.4,
    });
    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.position.set(TEE.x, 5, TEE.z);
    this.scene.add(this.ball);

    // tee peg under the ball
    const peg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.2, 4, 12),
      new THREE.MeshBasicMaterial({ color: GOLD })
    );
    peg.position.set(TEE.x, -1, TEE.z);
    this.scene.add(peg);

    // soft contact shadow grounding the ball
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const sg = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    sg.addColorStop(0, 'rgba(0,0,0,0.55)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(TEE.x, 0.6, TEE.z);
    this.scene.add(shadow);

    // --- routes ---
    const teeTop = new THREE.Vector3(TEE.x, 8, TEE.z);
    this.anchors = {
      carry: new THREE.Vector3(13, 24, 130),
      ob: new THREE.Vector3(WATER.x, 3, WATER.z),
      a: new THREE.Vector3(12, 2, 95),
      b: new THREE.Vector3(-2, 2, -60),
      c: new THREE.Vector3(GREEN.x, 2, GREEN.z),
    };
    // brighter cardinal for the 3D route — true #8C2F28 vanishes against pine at dusk
    // apex kept low enough to stay inside the 38° frustum from the chase camera
    this.redLine = makeTube(
      ballisticPoints(teeTop, new THREE.Vector3(WATER.x, -1, WATER.z), 32),
      new THREE.Color('#C25A4E'), 0.55
    );
    this.g1 = makeTube(ballisticPoints(teeTop, this.anchors.a, 26), GOLD, 0.45);
    this.g2 = makeTube(ballisticPoints(this.anchors.a, this.anchors.b, 20), GOLD, 0.45);
    this.g3 = makeTube(ballisticPoints(this.anchors.b, this.anchors.c, 14), GOLD, 0.45);
    [this.redLine, this.g1, this.g2, this.g3].forEach(m => this.scene.add(m));

    // splash ring at the water (revealed with the OB stamp)
    this.splash = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 3.4, 48),
      new THREE.MeshBasicMaterial({ color: CARDINAL, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    this.splash.rotation.x = -Math.PI / 2;
    this.splash.position.set(WATER.x, -1.0, WATER.z);
    this.scene.add(this.splash);

    // --- camera rails ---
    // the chase camera flies the LEFT flank of the hole — the routes live on the right,
    // so the lines always read side-on instead of ballooning past the lens
    this.camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 11, 318),
      new THREE.Vector3(-62, 44, 150),
      new THREE.Vector3(-58, 58, -50),
      new THREE.Vector3(-8, 86, -150),
    ], false, 'catmullrom', 0.35);
    this.lookPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, 250),
      new THREE.Vector3(14, 4, 70),
      new THREE.Vector3(12, 0, -40),
      new THREE.Vector3(GREEN.x, 0, GREEN.z),
    ], false, 'catmullrom', 0.35);

    this._camPos = new THREE.Vector3();
    this._camLook = new THREE.Vector3();
    this.camera.position.copy(this.camPath.getPoint(0));
    this.camera.lookAt(this.lookPath.getPoint(0));
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    // re-evaluate DPR before setSize — dragging between displays changes it
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 760 ? 1.5 : 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._needsRender = true;
  }

  setDusk(v) {
    this.dusk = v;
    this._needsRender = true;
  }

  setPointer(x, y) { // -1..1
    this.pointer.x = x; this.pointer.y = y;
  }

  setFlyProgress(raw, eased = raw) {
    this.flyProgress = eased; // camera rides the lingering ease
    this._needsRender = true;
    // routes + splash are choreographed on RAW progress so they stay in
    // lockstep with the DOM annotation windows in main.js
    const seg = (a, b) => THREE.MathUtils.clamp((raw - a) / (b - a), 0, 1);
    this.routeProgress.red = seg(0.10, 0.30);
    this.splashT = seg(0.30, 0.36);
    this.routeProgress.g1 = seg(0.46, 0.58);
    this.routeProgress.g2 = seg(0.62, 0.74);
    this.routeProgress.g3 = seg(0.78, 0.88);
  }

  project(v3, out = {}) {
    const v = v3.clone().project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * window.innerWidth;
    out.y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    out.behind = v.z > 1;
    return out;
  }

  resetRoutes() {
    this.routeProgress = { red: 0, g1: 0, g2: 0, g3: 0 };
    this.splashT = 0;
    this._needsRender = true;
  }

  render() {
    const t = this.clock.getElapsedTime();
    const dusk = this.dusk;

    // palette grade
    const bg = PINE.clone().lerp(NIGHT, dusk);
    this.renderer.setClearColor(bg);
    this.terrainUniforms.uBg.value.copy(bg);
    this.terrainUniforms.uDusk.value = dusk;
    this.terrainUniforms.uFogDensity.value = THREE.MathUtils.lerp(0.0032, 0.0046, dusk);

    // sun: lower + colder as night falls
    this.sun.color.set('#E8D9B0').lerp(new THREE.Color('#6B7A5E'), dusk);
    this.sun.intensity = THREE.MathUtils.lerp(2.2, 1.3, dusk);
    const elev = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(15, 4, dusk));
    this.sun.position.set(-120 * Math.cos(elev), 160 * Math.sin(elev) + 16, 60);

    // ball idle bob (hero only)
    if (!this.reduced) {
      this.ball.position.y = 5 + Math.sin(t * 0.7) * 0.5 * this.heroBlend;
      this.ball.rotation.y = t * 0.05;
    }

    // camera: hero idle pose blended against the fly path
    const p = THREE.MathUtils.clamp(this.flyProgress, 0, 1);
    this.camPath.getPoint(p, this._camPos);
    this.lookPath.getPoint(p, this._camLook);

    if (this.heroBlend > 0.001 && !this.reduced) {
      this._pointerSmooth.x += (this.pointer.x - this._pointerSmooth.x) * 0.06;
      this._pointerSmooth.y += (this.pointer.y - this._pointerSmooth.y) * 0.06;
      const drift = Math.sin(t * 0.22) * 1.4;
      this._camPos.x += (drift + this._pointerSmooth.x * 5) * this.heroBlend;
      this._camPos.y += (Math.sin(t * 0.31) * 0.7 - this._pointerSmooth.y * 3) * this.heroBlend;
      this._needsRender = true;
    }
    this.camera.position.copy(this._camPos);
    this.camera.lookAt(this._camLook);

    // routes
    const setDR = (mesh, p_) => mesh.geometry.setDrawRange(0, Math.floor(mesh.userData.totalIndex * p_));
    setDR(this.redLine, this.routeProgress.red);
    setDR(this.g1, this.routeProgress.g1);
    setDR(this.g2, this.routeProgress.g2);
    setDR(this.g3, this.routeProgress.g3);

    // splash ring
    const s = this.splashT || 0;
    this.splash.material.opacity = s > 0 ? (1 - s) * 0.9 : 0;
    const sc = 1 + s * 5;
    this.splash.scale.set(sc, sc, 1);

    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    const tick = () => {
      requestAnimationFrame(tick);
      if (!this.active) return;
      this.render();
    };
    tick();
  }
}
