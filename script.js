import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js";

const canvas = document.querySelector("#scene3d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
camera.position.set(0, 0.8, 8.6);

const rig = new THREE.Group();
scene.add(rig);

const ambient = new THREE.AmbientLight(0x90a4ff, 1.1);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0x5bd8ff, 3.2);
keyLight.position.set(4, 6, 4);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xff7766, 4.8, 18);
fillLight.position.set(-4.5, -1.8, 3.5);
scene.add(fillLight);

const goldLight = new THREE.PointLight(0xf2c14e, 2.6, 16);
goldLight.position.set(2.6, -3.8, -2);
scene.add(goldLight);

const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x5bd8ff,
  metalness: 0.42,
  roughness: 0.18,
  transmission: 0.08,
  clearcoat: 0.75,
  clearcoatRoughness: 0.18,
  emissive: 0x123041,
  emissiveIntensity: 0.55,
});

const core = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.15, 0.28, 220, 22),
  coreMaterial
);
core.position.set(1.85, 0.1, -0.4);
rig.add(core);

const wire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.45, 2),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  })
);
wire.position.copy(core.position);
rig.add(wire);

const nodeMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x58d68d, emissive: 0x12351f, emissiveIntensity: 0.4 }),
  new THREE.MeshStandardMaterial({ color: 0xff7766, emissive: 0x371a14, emissiveIntensity: 0.45 }),
  new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0x31230b, emissiveIntensity: 0.38 }),
  new THREE.MeshStandardMaterial({ color: 0xa987ff, emissive: 0x251b40, emissiveIntensity: 0.4 }),
];

const nodes = [];
const nodeGeometry = new THREE.OctahedronGeometry(0.16, 0);

for (let i = 0; i < 12; i += 1) {
  const mesh = new THREE.Mesh(nodeGeometry, nodeMaterials[i % nodeMaterials.length]);
  const angle = (i / 12) * Math.PI * 2;
  mesh.userData = {
    angle,
    radius: 2.45 + (i % 3) * 0.38,
    speed: 0.16 + (i % 4) * 0.025,
    y: (i % 5 - 2) * 0.42,
  };
  rig.add(mesh);
  nodes.push(mesh);
}

const linkPositions = new Float32Array(nodes.length * 2 * 3);
const links = new THREE.LineSegments(
  new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(linkPositions, 3)),
  new THREE.LineBasicMaterial({ color: 0x5bd8ff, transparent: true, opacity: 0.18 })
);
rig.add(links);

const particleCount = 950;
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const palette = [
  new THREE.Color(0x5bd8ff),
  new THREE.Color(0x58d68d),
  new THREE.Color(0xff7766),
  new THREE.Color(0xf2c14e),
  new THREE.Color(0xa987ff),
];

for (let i = 0; i < particleCount; i += 1) {
  const i3 = i * 3;
  const radius = 4 + Math.random() * 11;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.72;
  particlePositions[i3 + 2] = radius * Math.cos(phi);

  const color = palette[i % palette.length];
  particleColors[i3] = color.r;
  particleColors[i3 + 1] = color.g;
  particleColors[i3 + 2] = color.b;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
  })
);
scene.add(particles);

let pointerX = 0;
let pointerY = 0;
let scrollProgress = 0;
let layoutScale = 1;

function setSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const narrow = width < 720;
  const medium = width >= 720 && width < 980;

  layoutScale = narrow ? 0.72 : medium ? 0.86 : 1;
  core.position.set(narrow ? 1.25 : medium ? 2.15 : 1.85, narrow ? -0.85 : 0.1, narrow ? -1.1 : -0.4);
  core.scale.setScalar(narrow ? 0.78 : 1);
  wire.position.copy(core.position);
  wire.scale.setScalar(narrow ? 0.78 : 1);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateScrollProgress() {
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  scrollProgress = window.scrollY / scrollable;
}

function updateLinks() {
  nodes.forEach((node, index) => {
    const i6 = index * 6;
    linkPositions[i6] = core.position.x;
    linkPositions[i6 + 1] = core.position.y;
    linkPositions[i6 + 2] = core.position.z;
    linkPositions[i6 + 3] = node.position.x;
    linkPositions[i6 + 4] = node.position.y;
    linkPositions[i6 + 5] = node.position.z;
  });
  links.geometry.attributes.position.needsUpdate = true;
}

function renderFrame(time = 0) {
  const t = time * 0.001;
  const motion = reducedMotion ? 0.2 : 1;

  rig.rotation.y = t * 0.08 * motion + pointerX * 0.08 + scrollProgress * 0.9;
  rig.rotation.x = -0.08 + pointerY * 0.06;

  core.rotation.x = t * 0.36 * motion;
  core.rotation.y = t * 0.28 * motion;
  wire.rotation.x = -t * 0.08 * motion;
  wire.rotation.z = t * 0.12 * motion;

  nodes.forEach((node, index) => {
    const data = node.userData;
    const angle = data.angle + t * data.speed * motion;
    node.position.set(
      core.position.x + Math.cos(angle) * data.radius * layoutScale,
      data.y + Math.sin(angle * 1.7) * 0.42,
      core.position.z + Math.sin(angle) * (data.radius * 0.64) * layoutScale
    );
    node.rotation.x += 0.012 * motion;
    node.rotation.y += 0.016 * motion;
    node.scale.setScalar(1 + Math.sin(t * 2 + index) * 0.14);
  });

  particles.rotation.y = t * 0.018 * motion + scrollProgress * 0.25;
  particles.rotation.x = pointerY * 0.03;

  camera.position.x += (pointerX * 0.75 - camera.position.x) * 0.035;
  camera.position.y += (0.8 + pointerY * 0.36 - camera.position.y) * 0.035;
  camera.lookAt(0.7, 0, 0);

  updateLinks();
  renderer.render(scene, camera);

  if (!reducedMotion) {
    window.requestAnimationFrame(renderFrame);
  }
}

function setActiveNav() {
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const closest = sections.reduce((current, section) => {
    const top = Math.abs(section.getBoundingClientRect().top - 120);
    return top < current.distance ? { id: section.id, distance: top } : current;
  }, { id: "home", distance: Number.POSITIVE_INFINITY });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${closest.id}`);
  });
}

window.addEventListener("resize", setSize);
window.addEventListener("scroll", () => {
  updateScrollProgress();
  setActiveNav();
}, { passive: true });

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = -(event.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

setSize();
updateScrollProgress();
setActiveNav();
renderFrame();
