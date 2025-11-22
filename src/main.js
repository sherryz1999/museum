// src/main.js
// Updated: improved Google Slides embedding and debugging helpers.
// Swap the slides by editing SLIDES_EMBED_URL or SLIDES_ID below.

import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.159.0/examples/jsm/renderers/CSS3DRenderer.js';

const canvasContainer = document.body;

// --- Configuration ---
// Center YouTube video:
const YOUTUBE_VIDEO_ID = 'FXTDo0TEp6Q';

// Option A (recommended): paste the full published embed URL you get from
// File -> Publish to the web -> Embed in Google Slides. Example shown below.
// If you publish via Google Slides UI, copy the URL it gives and paste here.
const SLIDES_EMBED_URL = 'https://docs.google.com/presentation/d/1wQomrf_cSdXAveNj1rNkl9fo3GOgK_dN/embed?start=false&loop=false&delayms=3000';

// Option B: use SLIDES_ID; code will construct the standard embed path.
// const SLIDES_ID = '1wQomrf_cSdXAveNj1rNkl9fo3GOgK_dN';
// const SLIDES_EMBED_URL = `https://docs.google.com/presentation/d/${SLIDES_ID}/embed?start=false&loop=false&delayms=3000`;

const ROOM = { width: 12, height: 4, depth: 8 };

// --- WebGL renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CSS3D renderer (for iframe) ---
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
// Allow pointer events on the CSS3D container so iframe can be clicked
cssRenderer.domElement.style.pointerEvents = 'auto';
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

// Lighting + room omitted here for brevity — keep your existing room setup
// ... (keep your makePlane and room creation code unchanged) ...

// thumbnail loader
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

// createFrame: accepts slidesEmbedUrl to create a CSS3D iframe at that frame location
function createFrame({ x = 0, y = 1.6, z = -ROOM.depth / 2 + 0.01, videoId = '', title = '', slidesEmbedUrl = '' }) {
  const frameWidth = 3.2;
  const frameHeight = 1.8;

  // border behind plane (keeps same look)
  const borderGeo = new THREE.BoxGeometry(frameWidth + 0.12, frameHeight + 0.12, 0.08);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(x, y, z - 0.04);
  border.castShadow = true;
  scene.add(border);

  // visible plane placeholder
  const planeGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const placeholder = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const plane = new THREE.Mesh(planeGeo, placeholder);
  plane.position.set(x, y, z);
  plane.userData = { type: 'video-frame', videoId, title, slidesEmbedUrl };
  scene.add(plane);

  // YouTube thumbnail if videoId is present
  if (videoId) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    loader.load(thumbUrl, (tex) => {
      plane.material = new THREE.MeshBasicMaterial({ map: tex });
    }, undefined, () => {});
  }

  // If a slides embed URL is provided, place an interactive CSS3D iframe
  if (slidesEmbedUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = slidesEmbedUrl;
    iframe.style.border = '0';
    // allow interaction and fullscreen
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.style.pointerEvents = 'auto';

    // initial pixel size (will be adjusted in onResize)
    const pixelsPerUnit = Math.max(140, Math.min(260, Math.floor(window.devicePixelRatio * 160)));
    iframe.width = Math.round(frameWidth * pixelsPerUnit);
    iframe.height = Math.round(frameHeight * pixelsPerUnit);
    iframe.style.width = iframe.width + 'px';
    iframe.style.height = iframe.height + 'px';

    // debug logging
    iframe.addEventListener('load', () => {
      console.log('Slides iframe loaded:', slidesEmbedUrl);
    });
    iframe.addEventListener('error', (e) => {
      console.warn('Slides iframe error', e);
    });

    const cssObject = new CSS3DObject(iframe);
    cssObject.position.set(x, y, z + 0.02);
    cssObject.rotation.copy(plane.rotation);
    cssScene.add(cssObject);

    // store reference
    plane.userData.cssObject = cssObject;
    plane.userData.iframe = iframe;
  }

  // sheen overlay (optional)
  const sheen = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03
  }));
  sheen.position.set(x, y, z + 0.001);
  scene.add(sheen);

  return plane;
}

// Create frames (keep your existing positions)
createFrame({ x: 0, y: 1.6, z: -ROOM.depth / 2 + 0.06, videoId: YOUTUBE_VIDEO_ID, title: 'Violin' });
createFrame({ x: -4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, title: 'Slides', slidesEmbedUrl: SLIDES_EMBED_URL });
createFrame({ x: 4.2, y: 1.6, z: -ROOM.depth / 2 + 0.06, title: 'Art 2' });

// Raycast, modal, resize and animation loop — keep your existing logic, with this important onResize snippet:
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cssRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Resize CSS3D iframes proportionally
  const pixelsPerUnit = Math.max(140, Math.min(260, Math.floor(window.devicePixelRatio * 160)));
  cssScene.traverse((child) => {
    if (child instanceof CSS3DObject) {
      const el = child.element;
      el.style.width = Math.round(3.2 * pixelsPerUnit) + 'px';
      el.style.height = Math.round(1.8 * pixelsPerUnit) + 'px';
    }
  });

  cssRenderer.domElement.style.zIndex = 5;
  renderer.domElement.style.zIndex = 1;
}
window.addEventListener('resize', onResize);
onResize();

// Add a quick debug helper to show iframe objects found
console.log('CSS3D children at startup:', cssScene.children);
setTimeout(() => console.log('CSS3D children after 2s:', cssScene.children), 2000);

// Render both scenes in your animation loop:
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);
}
animate();
