// src/main.js
// Updated: left-side frame now displays a live Google Slide using CSS3DRenderer.
// The slides link is easy to swap: change SLIDES_ID below.
//
// Notes:
// - Uses CDN module imports so this runs in the browser without bundling.
// - Renders both WebGL scene and CSS3D scene (the iframe is a CSS3DObject).
// - The iframe accepts pointer events so you can interact with the slide.
// - If you prefer a thumbnail instead of the live iframe, remove the slidesEmbedUrl parameter.
//
// Usage: edit SLIDES_ID to swap in another presentation quickly.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

const canvasContainer = document.body;

// --- Configuration ---
// YouTube video ID for main (center) frame:
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Google Slides: easy-to-swap ID (change this)
const SLIDES_ID = '1wQomrf_cSdXAveNj1rNkl9fo3GOgK_dN';
// Derived embed URL for Google Slides (presentation embed)
const SLIDES_EMBED_URL = `https://docs.google.com/presentation/d/${SLIDES_ID}/embed?start=false&loop=false&delayms=3000`;

// Room size
const ROOM = {
  width: 12,
  height: 4,
  depth: 8
};

// --- Renderer (WebGL) ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CSS3D renderer for embedding iframes in 3D ---
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
// Let pointer events be none on the container; individual iframe will enable pointer events
cssRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(cssRenderer.domElement);

const scene = new THREE.Scene();
const cssScene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8); // neutral off-white ambient

// --- Camera ---
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

// --- Helper: plane maker ---
function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

// Floor
const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);
floor.receiveShadow = true;

// Ceiling
const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.height;
scene.add(ceiling);

// Walls
const backWall = makePlane(ROOM.width, ROOM.height, 0xffffff);
backWall.position.z = -ROOM.depth / 2;
backWall.position.y = ROOM.height / 2;
scene.add(backWall);

const frontWall = makePlane(ROOM.width, ROOM.height, 0xffffff);
frontWall.position.z = ROOM.depth / 2;
frontWall.rotation.y = Math.PI;
frontWall.position.y = ROOM.height / 2;
scene.add(frontWall);

const leftWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -ROOM.width / 2;
leftWall.position.y = ROOM.height / 2;
scene.add(leftWall);

const rightWall = makePlane(ROOM.depth, ROOM.height, 0xffffff);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = ROOM.width / 2;
rightWall.position.y = ROOM.height / 2;
scene.add(rightWall);

// --- Thumbnail loader & frame creation ---
// Using TextureLoader for thumbnails (YouTube)
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

// createFrame now accepts either a videoId (YouTube) OR a slidesEmbedUrl (for CSS3D iframe)
// If slidesEmbedUrl is provided, a CSS3D iframe is placed at the frame location (left frame use-case).
function createFrame({ x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01, videoId = '', title = '', slidesEmbedUrl = '' }) {
  const frameWidth = 3.2;
  const frameHeight = 1.8;

  // Frame border (extruded-like look using BoxGeometry behind the plane)
  const borderGeo = new THREE.BoxGeometry(frameWidth + 0.12, frameHeight + 0.12, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(x, y, z - 0.04);
  border.castShadow = true;
  scene.add(border);

  // Main display plane (thumbnail or placeholder)
  const planeGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const plane = new THREE.Mesh(planeGeo, placeholder);
  plane.position.set(x, y, z);
  plane.userData = { type: 'video-frame', videoId, title, slidesEmbedUrl };
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);

  // If a YouTube video ID is provided, attempt to load its thumbnail as texture
  if (videoId) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    loader.load(
      thumbUrl,
      (tex) => {
        plane.material = new THREE.MeshBasicMaterial({ map: tex });
        plane.material.needsUpdate = true;
      },
      undefined,
      () => {
        // keep placeholder if thumbnail fails
      }
    );
  }

  // If slidesEmbedUrl is provided, create a CSS3D iframe and place it roughly where the plane is.
  // The iframe is interactive. It sits in the cssScene so it overlays the WebGL canvas.
  if (slidesEmbedUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = slidesEmbedUrl;
    iframe.style.border = '0';
    // default pixel size for iframe - this keeps a reasonable aspect ratio
    // You can tweak these sizes or make them responsive in onResize
    iframe.width = Math.round(frameWidth * 200); // heuristic pixels per world unit
    iframe.height = Math.round(frameHeight * 200);
    iframe.style.width = iframe.width + 'px';
    iframe.style.height = iframe.height + 'px';
    iframe.style.pointerEvents = 'auto'; // allow interacting with the slide
    iframe.allow = 'autoplay; encrypted-media; fullscreen';

    const cssObject = new CSS3DObject(iframe);
    // CSS3DObject uses the same position/rotation as WebGL objects (world units)
    cssObject.position.set(x, y, z + 0.02); // place slightly in front of the plane
    // rotate to face same direction as plane (plane faces +z by default)
    cssObject.rotation.copy(plane.rotation);
    cssScene.add(cssObject);

    // Store reference so we can update size on resize if needed
    plane.userData.cssObject = cssObject;
  }

  // subtle reflection plane in front for sheen (WebGL)
  const sheen = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03
  }));
  sheen.position.set(x, y, z + 0.001);
  scene.add(sheen);

  return plane;
}

// Main (center) frame uses the YouTube thumbnail (click opens modal)
const mainFrame = createFrame({
  x: 0,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: YOUTUBE_VIDEO_ID,
  title: 'Violin Performance'
});

// Left frame: show live Google Slides (interactive)
createFrame({
  x: -4.2,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: '', // no youtube thumbnail for left frame
  title: 'Slides',
  slidesEmbedUrl: SLIDES_EMBED_URL
});

// Right frame: decorative (existing behavior)
createFrame({
  x: 4.2,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: '',
  title: 'Art 2'
});

// --- Raycasting for clicks on main frames (so center still opens modal) ---
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
    // open modal only for objects that have a YouTube id (so slides iframe won't be reopened here)
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

// --- Resize handling: update both renderers and iframe pixel sizes for CSS3D objects ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Update CSS3D iframe sizes proportional to the world size of the frame.
  // This uses a simple heuristic: pixelsPerUnit (tune as needed).
  const pixelsPerUnit = Math.max(140, Math.min(260, Math.floor(window.devicePixelRatio * 160)));
  cssScene.traverse((child) => {
    if (child instanceof CSS3DObject) {
      const el = child.element;
      // attempt to infer world size from element attributes if present
      // default to 3.2 x 1.8 (frame width/height)
      const width = Math.round(3.2 * pixelsPerUnit);
      const height = Math.round(1.8 * pixelsPerUnit);
      el.style.width = width + 'px';
      el.style.height = height + 'px';
    }
  });

  // Place CSS renderer overlay above WebGL canvas
  cssRenderer.domElement.style.zIndex = 5;
  renderer.domElement.style.zIndex = 1;
}
window.addEventListener('resize', onResize);
onResize();

// --- Animation loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // subtle float for thumbnail frames (stylistic)
  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && o.userData.type === 'video-frame') {
      o.rotation.z = Math.sin(t + (o.position.x || 0)) * 0.002;
    }
  });

  renderer.render(scene, camera);
  // render CSS3D overlay (iframes)
  cssRenderer.render(cssScene, camera);
}
animate();

// --- Helper log if video id wasn't set (keeps previous behavior) ---
if (!YOUTUBE_VIDEO_ID || YOUTUBE_VIDEO_ID === 'REPLACE_WITH_VIDEO_ID') {
  console.warn('No YouTube video ID configured. Open src/main.js and set YOUTUBE_VIDEO_ID to your video ID.');
}
