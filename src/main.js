// src/main.js
// Fix: ensure the Google Slides iframe is constrained to the left frame (no full-screen takeover).
// Strategy:
// - Render iframes via CSS3DRenderer inside a container <div> that controls pixel size.
// - Make the CSS3DRenderer canvas ignore pointer events (so only the container receives them).
// - Update container sizes on resize so the iframe stays the correct size.
// - Keep slides/embed URL easy to swap via SLIDES_EMBED_URL.
//
// Replace your existing src/main.js with this file (or just the createFrame / CSS3D parts).
// Make sure your Slides are "Published to the web" (File → Publish to the web → Embed) or embeddable.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

const canvasContainer = document.body;

// --- Configuration ---
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Use the published/embed URL from Google Slides (recommended).
// Example embed URL:
// https://docs.google.com/presentation/d/1wQomrf_cSdXAveNj1rNkl9fo3GOgK_dN/embed?start=false&loop=false&delayms=3000
const SLIDES_EMBED_URL = 'https://docs.google.com/presentation/d/1wQomrf_cSdXAveNj1rNkl9fo3GOgK_dN/embed?start=false&loop=false&delayms=3000';

const ROOM = { width: 12, height: 4, depth: 8 };

// --- WebGL renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CSS3D renderer for iframes ---
// IMPORTANT: make the CSS3D renderer ignore pointer events at the container level so
// only the iframe's own element receives interactions (prevents accidental full-screen overlays).
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.pointerEvents = 'none'; // <- container doesn't capture events
cssRenderer.domElement.style.zIndex = '5';
document.body.appendChild(cssRenderer.domElement);

// --- Scenes & camera ---
const scene = new THREE.Scene();
const cssScene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);

const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
camera.position.set(0, 1.6, ROOM.depth / 2 + 1.5);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 25;

// --- Lighting & room (kept minimal) ---
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(-5, ROOM.height * 0.9, 5);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

function makePlane(w, h, color) {
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, mat);
}

const floor = makePlane(ROOM.width, ROOM.depth, 0xede6dd);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const ceiling = makePlane(ROOM.width, ROOM.depth, 0xf0f0f0);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.height;
scene.add(ceiling);

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

// --- Thumbnail loader ---
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

// createFrame now uses a wrapper container for CSS3D iframe so sizing is controlled
function createFrame({ x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01, videoId = '', title = '', slidesEmbedUrl = '' }) {
  const frameWidth = 3.2;
  const frameHeight = 1.8;

  // decorative border behind the panel
  const borderGeo = new THREE.BoxGeometry(frameWidth + 0.12, frameHeight + 0.12, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(x, y, z - 0.04);
  border.castShadow = true;
  scene.add(border);

  // visual plane (placeholder or thumbnail)
  const planeGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const plane = new THREE.Mesh(planeGeo, placeholder);
  plane.position.set(x, y, z);
  plane.userData = { type: 'video-frame', videoId, title, slidesEmbedUrl };
  plane.receiveShadow = true;
  plane.castShadow = true;
  scene.add(plane);

  // load YouTube thumbnail if provided
  if (videoId) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    loader.load(
      thumbUrl,
      (tex) => {
        plane.material = new THREE.MeshBasicMaterial({ map: tex });
        plane.material.needsUpdate = true;
      },
      undefined,
      () => {}
    );
  }

  // If a slidesEmbedUrl is provided, create a sized container and put the iframe inside it.
  // Using a container (div) avoids the iframe stretching unexpectedly.
  if (slidesEmbedUrl) {
    // pixelsPerUnit heuristic - controls how many screen pixels represent one world unit for the iframe
    const pixelsPerUnit = Math.max(120, Math.min(220, Math.floor(window.devicePixelRatio * 160)));
    const pxW = Math.round(frameWidth * pixelsPerUnit);
    const pxH = Math.round(frameHeight * pixelsPerUnit);

    // container controls the pixel footprint of the iframe
    const container = document.createElement('div');
    container.style.width = pxW + 'px';
    container.style.height = pxH + 'px';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'auto'; // allow interaction with the iframe only inside container
    container.style.borderRadius = '2px';
    container.style.boxSizing = 'border-box';
    // prevent the container from being considered full-screen by browser defaults
    container.style.position = 'relative';
    container.style.background = '#000'; // fallback background while slides load

    const iframe = document.createElement('iframe');
    iframe.src = slidesEmbedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.style.pointerEvents = 'auto'; // iframe receives events

    // append iframe to container
    container.appendChild(iframe);

    // create CSS3DObject from the container (not the iframe directly)
    const cssObject = new CSS3DObject(container);
    cssObject.position.set(x, y, z + 0.02); // slightly in front of plane
    cssObject.rotation.copy(plane.rotation);
    cssScene.add(cssObject);

    // store reference to adjust size on resize
    plane.userData.cssObject = cssObject;
    plane.userData.cssContainer = container;
    plane.userData.iframe = iframe;

    // debug logging
    iframe.addEventListener('load', () => {
      console.log('Slides iframe loaded (container px):', pxW, pxH, slidesEmbedUrl);
    });
    iframe.addEventListener('error', (e) => {
      console.warn('Slides iframe error', e);
    });
  }

  // subtle sheen in front
  const sheen = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03
  }));
  sheen.position.set(x, y, z + 0.001);
  scene.add(sheen);

  return plane;
}

// create frames: center = YouTube (click to open modal), left = Slides, right = decorative
createFrame({
  x: 0,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  videoId: YOUTUBE_VIDEO_ID,
  title: 'Violin Performance'
});

createFrame({
  x: -4.2,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  title: 'Slides',
  slidesEmbedUrl: SLIDES_EMBED_URL
});

createFrame({
  x: 4.2,
  y: 1.6,
  z: -ROOM.depth / 2 + 0.06,
  title: 'Art 2'
});

// --- Raycasting / clicks (open modal only for YouTube frames) ---
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

// --- Modal (YouTube) ---
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

// --- Resize: update both renderers and the CSS3D container sizes ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // update CSS3D container sizes so iframe pixel footprint matches the world frame size
  const pixelsPerUnit = Math.max(120, Math.min(220, Math.floor(window.devicePixelRatio * 160)));
  cssScene.traverse((child) => {
    if (child instanceof CSS3DObject) {
      const el = child.element;
      // assume frame visible size 3.2 x 1.8 unless you stored per-frame sizes
      el.style.width = Math.round(3.2 * pixelsPerUnit) + 'px';
      el.style.height = Math.round(1.8 * pixelsPerUnit) + 'px';
    }
  });

  // layer ordering
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

  // gentle float of frames
  const t = performance.now() * 0.0002;
  scene.traverse((o) => {
    if (o.userData && o.userData.type === 'video-frame') {
      o.rotation.z = Math.sin(t + (o.position.x || 0)) * 0.002;
    }
  });

  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);
}
animate();

// Helpful debug: list CSS3D children (so you can confirm the container exists)
console.log('cssScene children:', cssScene.children);
setTimeout(() => console.log('cssScene children after 2s:', cssScene.children), 2000);
