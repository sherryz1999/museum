// src/main.js
// Fixes for CSS3D iframe sizing so Google Slides stays within the left frame.
// - Adds a small visual debug border on the iframe container (toggle DEBUG_FRAME_BORDER).
// - Constrains iframe pixel footprint via pxW/pxH and clamps pixelsPerUnit to avoid full-screen growth.
// - Ensures cssRenderer container ignores pointer events while the iframe container receives them.
// - Keeps SLIDES_EMBED_URL easy to swap.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

const canvasContainer = document.body;

// --- Configuration ---
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Use the published/embed URL from Google Slides (recommended).
const SLIDES_EMBED_URL = 'https://docs.google.com/presentation/d/1wQomrf_cSdXAveNj1rNkl9fo3GOgK_dN/embed?start=false&loop=false&delayms=3000';

// Toggle a visible border to confirm iframe container placement (set to false to hide)
const DEBUG_FRAME_BORDER = true;

const ROOM = { width: 12, height: 4, depth: 8 };

// --- WebGL renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CSS3D renderer for iframes ---
// container should ignore pointer events; individual iframe containers will receive them.
// this prevents accidental global pointer capture.
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.pointerEvents = 'none'; // container doesn't capture events
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

// --- Basic room (floor, ceiling, walls) ---
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

// --- Loader ---
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

// createFrame now wraps the iframe in a sized container (div) so its pixel footprint is fixed.
// This prevents the iframe from "taking over" the whole screen.
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

  // visible plane (placeholder or thumbnail)
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

  // Slides: create a constrained container div and add it as a CSS3DObject
  if (slidesEmbedUrl) {
    // pixelsPerUnit controls the pixel footprint; lower values avoid oversized iframes on high DPI
    const pixelsPerUnit = Math.max(100, Math.min(160, Math.floor(window.devicePixelRatio * 140)));
    const pxW = Math.round(frameWidth * pixelsPerUnit);
    const pxH = Math.round(frameHeight * pixelsPerUnit);

    const container = document.createElement('div');
    container.style.width = pxW + 'px';
    container.style.height = pxH + 'px';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'auto'; // allow interacting with the iframe only inside this container
    container.style.borderRadius = '2px';
    container.style.boxSizing = 'border-box';
    container.style.position = 'relative';
    container.style.background = '#000'; // fallback while slides load
    // visual debug border so you can see the container location/size
    if (DEBUG_FRAME_BORDER) {
      container.style.border = '2px solid rgba(255,255,255,0.65)';
      container.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
    }

    const iframe = document.createElement('iframe');
    iframe.src = slidesEmbedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.style.pointerEvents = 'auto';
    // defensive: prevent the iframe from requesting fullscreen unless intentional via user click
    iframe.setAttribute('allowfullscreen', '');

    container.appendChild(iframe);

    // wrap container as CSS3DObject
    const cssObject = new CSS3DObject(container);
    cssObject.position.set(x, y, z + 0.02);
    cssObject.rotation.copy(plane.rotation);
    cssScene.add(cssObject);

    // keep refs for resize updates
    plane.userData.cssObject = cssObject;
    plane.userData.cssContainer = container;
    plane.userData.iframe = iframe;

    iframe.addEventListener('load', () => {
      console.log('Slides iframe loaded (container px):', pxW, pxH, slidesEmbedUrl);
    });
    iframe.addEventListener('error', (e) => {
      console.warn('Slides iframe error', e);
    });
  }

  // subtle sheen overlay
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

// --- Resize: update both renderers and CSS3D container sizes ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // smaller, safer pixelsPerUnit clamp so iframe doesn't grow too large
  const pixelsPerUnit = Math.max(100, Math.min(160, Math.floor(window.devicePixelRatio * 140)));
  cssScene.traverse((child) => {
    if (child instanceof CSS3DObject) {
      const el = child.element;
      el.style.width = Math.round(3.2 * pixelsPerUnit) + 'px';
      el.style.height = Math.round(1.8 * pixelsPerUnit) + 'px';
      // ensure element's internal iframe fills container
      if (el.firstChild && el.firstChild.tagName === 'IFRAME') {
        el.firstChild.style.width = '100%';
        el.firstChild.style.height = '100%';
      }
      // enforce max size so nothing expands too far on very large screens
      el.style.maxWidth = Math.round(4.2 * pixelsPerUnit) + 'px';
      el.style.maxHeight = Math.round(2.2 * pixelsPerUnit) + 'px';
    }
  });

  cssRenderer.domElement.style.zIndex = 5;
  renderer.domElement.style.zIndex = 1;
}
window.addEventListener('resize', onResize);
onResize();

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // gentle float
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

// Debug: list CSS3D children so you can verify container presence
console.log('cssScene children:', cssScene.children);
setTimeout(() => console.log('cssScene children after 2s:', cssScene.children), 2000);
