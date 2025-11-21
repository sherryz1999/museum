// src/main.js
// Browser-friendly imports (use full CDN URLs so the browser can resolve modules)
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';

const canvasContainer = document.body;

// --- Configuration ---
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
const loader = new THREE.TextureLoader();
// try to hint crossOrigin for thumbnails (may or may not help depending on host)
if (typeof loader.setCrossOrigin === 'function') {
  try { loader.setCrossOrigin('anonymous'); } catch (e) {}
}
loader.crossOrigin = 'anonymous';

function createFrame({ x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01, videoId = '', title = '' }) {
  const frameWidth = 3.2;
  const frameHeight = 1.8;

  // Frame border (a thin box behind the plane to simulate frame depth)
  const borderGeo = new THREE.BoxGeometry(frameWidth + 0.12, frameHeight + 0.12, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(x, y, z - 0.04);
  border.castShadow = true;
  scene.add(border);

  // Thumbnail plane
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const planeGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const plane = new THREE.Mesh(planeGeo, placeholder);
  plane.position.set(x, y, z);
  plane.userData = { type: 'video-frame', videoId, title };
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);

  if (videoId && thumbUrl) {
    loader.load(
      thumbUrl,
      (tex) => {
        plane.material = new THREE.MeshBasicMaterial({ map: tex });
        plane.material.needsUpdate = true;
      },
      undefined,
      () => {
        // keep placeholder if thumbnail fails to load (CORS or network)
      }
    );
  }

  // subtle reflection plane in front for sheen
  const sheen = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.05,
    blending: THREE.NormalBlending
  }));
  sheen.position.set(x, y, z + 0.001);
  scene.add(sheen);

  return plane;
}

// Add a single large frame centered on the back wall
const mainFrame = createFrame({
  x: 0,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: YOUTUBE_VIDEO_ID,
  title: 'Violin Performance'
});

// Add a couple of smaller frames as decoration (no videos)
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

// --- Helper ---
if (!YOUTUBE_VIDEO_ID || YOUTUBE_VIDEO_ID === 'REPLACE_WITH_VIDEO_ID') {
  console.warn('No YouTube video ID configured. Open src/main.js and set YOUTUBE_VIDEO_ID to your video ID.');
}
