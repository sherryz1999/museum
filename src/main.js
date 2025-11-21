// src/main.js
// Updated to give the picture frame a more museum-like appearance:
// - Uses an extruded frame geometry with an inner cutout (mat + opening)
// - Adds a white matboard (beveled inset) for the thumbnail
// - Adds a subtle "glass" overlay (transparent, slightly reflective)
// - Uses a wood-like standard material for the frame (tweakable)
// - Keeps thumbnail loading and modal logic intact
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

const canvasContainer = document.body;

// --- Configuration ---
// Your YouTube video ID
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Room size
const ROOM = {
  width: 12,
  height: 4,
  depth: 8
};

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8); // neutral off-white ambient

const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
camera.position.set(0, 1.6, ROOM.depth / 2 + 1.5);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 25;

// --- Lighting ---
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-5, ROOM.height * 0.9, 5);
dir.castShadow = true;
dir.shadow.camera.left = -10;
dir.shadow.camera.right = 10;
dir.shadow.camera.top = 10;
dir.shadow.camera.bottom = -10;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

// --- Create room with separate planes so we can color floor/ceiling neutrally ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

// Floor (neutral warm gray/beige)
const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);
floor.receiveShadow = true;

// Ceiling (neutral cool)
const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.height;
scene.add(ceiling);

// Back wall (where we'll hang the performance)
const backWall = makePlane(ROOM.width, ROOM.height, 0xffffff);
backWall.position.z = -ROOM.depth / 2;
backWall.position.y = ROOM.height / 2;
scene.add(backWall);

// Front wall
const frontWall = makePlane(ROOM.width, ROOM.height, 0xffffff);
frontWall.position.z = ROOM.depth / 2;
frontWall.rotation.y = Math.PI;
frontWall.position.y = ROOM.height / 2;
scene.add(frontWall);

// Left wall
const leftWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -ROOM.width / 2;
leftWall.position.y = ROOM.height / 2;
scene.add(leftWall);

// Right wall
const rightWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = ROOM.width / 2;
rightWall.position.y = ROOM.height / 2;
scene.add(rightWall);

// --- Picture frame with YouTube thumbnail ---
// We'll construct a museum-like frame using an extruded geometry (outer rectangle with inner hole),
// add a white mat (thin plane inset), the thumbnail, and a glass overlay.

const loader = new THREE.TextureLoader();
// hint the browser we want CORS (may help in some environments)
if (typeof loader.setCrossOrigin === 'function') {
  try { loader.setCrossOrigin('anonymous'); } catch (e) {}
}
loader.crossOrigin = 'anonymous';

function createFrame({ x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01, videoId = '', title = '' }) {
  const openingWidth = 3.2;
  const openingHeight = 1.8;
  const frameDepth = 0.08; // extrusion depth
  const frameBorderThickness = 0.16; // thickness of the visible frame edge
  const matInset = 0.14; // width of the white mat between frame and thumbnail
  const outerW = openingWidth + frameBorderThickness * 2;
  const outerH = openingHeight + frameBorderThickness * 2;

  // Create frame shape (outer rectangle with inner hole)
  const shape = new THREE.Shape();
  shape.moveTo(-outerW / 2, -outerH / 2);
  shape.lineTo(-outerW / 2, outerH / 2);
  shape.lineTo(outerW / 2, outerH / 2);
  shape.lineTo(outerW / 2, -outerH / 2);
  shape.lineTo(-outerW / 2, -outerH / 2);

  // Inner hole (the opening where the mat + thumbnail sit)
  const hole = new THREE.Path();
  hole.moveTo(-openingWidth / 2, -openingHeight / 2);
  hole.lineTo(-openingWidth / 2, openingHeight / 2);
  hole.lineTo(openingWidth / 2, openingHeight / 2);
  hole.lineTo(openingWidth / 2, -openingHeight / 2);
  hole.lineTo(-openingWidth / 2, -openingHeight / 2);
  shape.holes.push(hole);

  // Extrude the frame to give depth
  const extrudeSettings = {
    depth: frameDepth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1
  };
  const frameGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Recenter geometry so the front face sits at z = 0
  frameGeo.translate(0, 0, -frameDepth / 2);

  // Frame material - wood-like
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x6b452b, // warm wood color
    roughness: 0.6,
    metalness: 0.05
  });

  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  frameMesh.position.set(x, y, z - frameDepth / 2); // push slightly into the wall
  scene.add(frameMesh);

  // Add inner mat (thin white inset) - sits slightly in front of the frame opening
  const matWidth = openingWidth - matInset * 2;
  const matHeight = openingHeight - matInset * 2;
  const matGeo = new THREE.PlaneGeometry(matWidth, matHeight);
  const matMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const matMesh = new THREE.Mesh(matGeo, matMat);
  matMesh.position.set(x, y, z + 0.005); // slightly in front of the frame face
  scene.add(matMesh);

  // Add thumbnail plane (the actual image) slightly in front of the mat
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const thumbGeo = new THREE.PlaneGeometry(matWidth - 0.02, matHeight - 0.02);
  const thumbMesh = new THREE.Mesh(thumbGeo, placeholder);
  thumbMesh.position.set(x, y, z + 0.01); // in front of mat
  thumbMesh.userData = { type: 'video-frame', videoId, title };
  thumbMesh.castShadow = true;
  thumbMesh.receiveShadow = true;
  scene.add(thumbMesh);

  if (videoId && thumbUrl) {
    loader.load(
      thumbUrl,
      (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        thumbMesh.material = new THREE.MeshBasicMaterial({ map: tex });
        thumbMesh.material.needsUpdate = true;
      },
      undefined,
      () => {
        // keep placeholder if thumbnail fails
      }
    );
  }

  // Add a subtle glass overlay - thin transparent plane to emulate glazing
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.25,
    transparent: true,
    opacity: 0.08,
    reflectivity: 0.2,
    clearcoat: 0.1
  });
  const glassMesh = new THREE.Mesh(thumbGeo.clone(), glassMat);
  glassMesh.position.set(x, y, z + 0.017);
  scene.add(glassMesh);

  // Slight decorative fillet on outer frame edge: add a subtle rim (narrow box)
  const rimGeo = new THREE.BoxGeometry(outerW + 0.002, outerH + 0.002, 0.004);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1f17, roughness: 0.7 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(x, y, z - frameDepth / 2 - 0.002);
  scene.add(rimMesh);

  // Grouping would be nice but return the thumbnail mesh so click detection still works
  return thumbMesh;
}

// Add a single large frame centered on the back wall
const mainFrame = createFrame({
  x: 0,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: YOUTUBE_VIDEO_ID,
  title: 'Violin Performance'
});

// Add a couple of smaller framed decorations (no videos)
createFrame({ x: -4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, videoId: '', title: 'Art 1' });
createFrame({ x: 4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, videoId: '', title: 'Art 2' });

// --- Raycasting for clicks ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);
  for (const i of intersects) {
    const obj = i.object;
    if (obj.userData && obj.userData.type === 'video-frame' && obj.userData.videoId) {
      openVideoModal(obj.userData.videoId);
      break;
    }
  }
}
window.addEventListener('pointerdown', onPointerDown);

// --- Modal logic to show YouTube embed ---
const modal = document.getElementById('video-modal');
const iframe = document.getElementById('yt-iframe');
const closeBtn = document.getElementById('close-btn');

function openVideoModal(videoId) {
  if (iframe && modal) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } else {
    // fallback: open direct YouTube link in new tab
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener');
  }
}

function closeVideoModal() {
  if (iframe && modal) {
    iframe.src = '';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
if (modal) modal.addEventListener('click', (e) => {
  if (e.target === modal) closeVideoModal();
});

// --- Resize ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// --- Animation loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // subtle float for frames (stylistic)
  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && o.userData.type === 'video-frame') {
      o.rotation.z = Math.sin(t + o.position.x) * 0.002;
    }
  });

  renderer.render(scene, camera);
}
animate();

// --- Helper: show a friendly console message if the video id wasn't replaced ---
if (!YOUTUBE_VIDEO_ID || YOUTUBE_VIDEO_ID === 'REPLACE_WITH_VIDEO_ID') {
  console.warn('No YouTube video ID configured. Open src/main.js and set YOUTUBE_VIDEO_ID to your video ID.');
}
