// The Academy's roof sign in 3D (Three.js). Drops in, sways, follows the pointer, and turns to show
// the phone number on its back as the hero scrolls away. Hidden gracefully if WebGL is unavailable.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('[data-sign3d]');
const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function signTexture(lines, w = 2048, h = 720) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  // red L plates at both ends
  const plate = (x) => {
    g.fillStyle = '#ffffff'; g.fillRect(x, 70, 230, 230);
    g.strokeStyle = '#d0d4dc'; g.lineWidth = 6; g.strokeRect(x, 70, 230, 230);
    g.fillStyle = '#d92d20'; g.fillRect(x + 60, 100, 52, 170); g.fillRect(x + 60, 218, 120, 52);
  };
  plate(60); plate(w - 290);
  g.fillStyle = '#0d1526'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for (const l of lines) {
    g.font = l.font;
    let size = parseInt(l.font.match(/(\d+)px/)[1], 10);
    while (g.measureText(l.text).width > l.max && size > 20) { size -= 4; g.font = l.font.replace(/\d+px/, `${size}px`); }
    g.fillText(l.text, w / 2, l.y);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function lPlateTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#d92d20'; g.fillRect(186, 150, 60, 230); g.fillRect(186, 320, 150, 60);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / 0.9, 1 / 0.8); t.offset.set(0.5, 0);
  return t;
}

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(13,21,38,0.45)'); r.addColorStop(1, 'rgba(13,21,38,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

async function init() {
  if (!canvas) return;
  // Weaker phones and data-saver keep the plain photo.
  if ((navigator.deviceMemory && navigator.deviceMemory < 4) || navigator.connection?.saveData) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch { return; }
  await (document.fonts?.ready ?? Promise.resolve());

  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 860 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.05, 5.5);
  camera.lookAt(0, 0.38, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe5ee, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 4); scene.add(key);

  // Sign body: a trapezoid profile extruded along its width.
  const W = 2.5, D = 0.9, DT = 0.36, H = 0.8;
  const profile = new THREE.Shape();
  profile.moveTo(-D / 2, 0); profile.lineTo(D / 2, 0); profile.lineTo(DT / 2, H); profile.lineTo(-DT / 2, H); profile.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(profile, { depth: W, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 4 });
  bodyGeo.translate(0, 0, -W / 2);
  bodyGeo.rotateY(Math.PI / 2);                     // extrude axis -> X
  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const body = new THREE.Mesh(bodyGeo, white);

  const sign = new THREE.Group();
  sign.add(body);

  // Slanted faces carry the artwork.
  const slant = Math.hypot((D - DT) / 2, H);
  const tilt = Math.atan(((D - DT) / 2) / H);
  const zMid = (D / 2 + DT / 2) / 2;
  const off = 0.022;
  const front = signTexture([
    { text: 'WELLINGBOROUGH', font: '800 220px "Bricolage Grotesque", sans-serif', y: 260, max: 1380 },
    { text: 'DRIVING ACADEMY', font: '800 150px "Bricolage Grotesque", sans-serif', y: 430, max: 1300 },
    { text: 'AUTO  ·  ELECTRIC', font: '700 80px "Bricolage Grotesque", sans-serif', y: 540, max: 1000 },
    { text: 'W 226682', font: '800 150px "Bricolage Grotesque", sans-serif', y: 690, max: 1000 },
  ]);
  const back = signTexture([
    { text: 'CALL THE OFFICE', font: '600 96px "Bricolage Grotesque", sans-serif', y: 200, max: 1300 },
    { text: '01933 226682', font: '800 260px "Bricolage Grotesque", sans-serif', y: 470, max: 1440 },
    { text: '45 BROAD GREEN · WELLINGBOROUGH', font: '600 80px "Bricolage Grotesque", sans-serif', y: 620, max: 1500 },
  ]);
  const faceGeo = new THREE.PlaneGeometry(W - 0.02, slant - 0.02);
  const mkFace = (map, side) => {
    const m = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ map, roughness: 0.45, toneMapped: false }));
    m.rotation.order = 'YXZ';
    m.rotation.x = -tilt; m.rotation.y = side > 0 ? 0 : Math.PI;
    const n = new THREE.Vector3(0, Math.sin(tilt), Math.cos(tilt) * side);
    m.position.set(0, H / 2, zMid * side).addScaledVector(n, off);
    return m;
  };
  sign.add(mkFace(front, 1), mkFace(back, -1));

  // End caps with L plates.
  const capShape = new THREE.Shape();
  capShape.moveTo(-D / 2 + 0.03, 0.03); capShape.lineTo(D / 2 - 0.03, 0.03); capShape.lineTo(DT / 2 - 0.02, H - 0.03); capShape.lineTo(-DT / 2 + 0.02, H - 0.03); capShape.closePath();
  const capGeo = new THREE.ShapeGeometry(capShape);
  const capMat = new THREE.MeshStandardMaterial({ map: lPlateTexture(), roughness: 0.45, toneMapped: false });
  for (const s of [1, -1]) {
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.y = s * Math.PI / 2;
    cap.position.x = s * (W / 2 + 0.02);
    sign.add(cap);
  }

  // Magnetic base and a soft contact shadow.
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.07, D + 0.04), new THREE.MeshStandardMaterial({ color: 0x1b2232, roughness: 0.6 }));
  base.position.y = -0.03; sign.add(base);
  sign.position.y = 0.05;

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.8), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.2;

  const rig = new THREE.Group();
  rig.add(sign, shadow);
  rig.rotation.y = -0.35;
  scene.add(rig);

  // Size to the canvas box.
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1.2 ? 6.8 : 5.5;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas); resize();

  // Inputs: pointer and hero scroll progress.
  const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0, s: 0 };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; }, { passive: true });
  const scrollProgress = () => {
    const r = hero.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.8)));
  };

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(canvas);

  const clock = new THREE.Clock();
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  let running = false;

  function frame() {
    const t = clock.getElapsedTime();
    const intro = reduce ? 1 : easeOut(Math.min(1, (performance.now() - start) / 1600));
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;
    eased.s += (scrollProgress() - eased.s) * 0.12;
    const sway = reduce ? 0 : Math.sin(t * 0.45) * 0.28;
    rig.rotation.y = -0.35 + sway + eased.x * 0.5 + eased.s * Math.PI;   // turns to the phone number
    rig.rotation.x = eased.y * 0.12 + 0.04;
    sign.position.y = 0.05 + (reduce ? 0 : Math.sin(t * 1.3) * 0.04) + (1 - intro) * 2.2;  // drops in
    sign.rotation.z = (1 - intro) * 0.35;
    shadow.material.opacity = 0.35 + intro * 0.65 - Math.max(0, sign.position.y - 0.05) * 0.2;
    rig.position.y = -eased.s * 0.5;
    renderer.render(scene, camera);
  }
  function loop() {
    if (running) return;
    running = true;
    const tick = () => {
      if (!visible) { running = false; return; }
      frame();
      requestAnimationFrame(tick);
    };
    tick();
  }
  frame();
  canvas.classList.add('is-ready');
  loop();
}

init().catch(() => { /* static hero photo remains */ });
