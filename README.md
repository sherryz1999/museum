```markdown
# Virtual Museum (Three.js) — Violin Performance

This is a small single-page Three.js scene that creates a minimalist virtual museum room with white walls, neutral ceiling and floor, and a framed YouTube video of your violin performance.

What is included
- index.html — page shell and modal container
- styles.css — minimal UI + modal styling
- src/main.js — Three.js scene that builds the room, adds a framed thumbnail, and opens a YouTube embed when you click the frame

Quick start
1. Clone the repository (or add these files to your project).
2. Edit `src/main.js` and verify the `YOUTUBE_VIDEO_ID` constant is set to your YouTube video ID.
   - It is already set to the video ID from the link you provided: `FXTDo0TEp6Q`.
3. Serve the folder (recommended) using a static server:
   - Python 3: `python -m http.server 8080`
   - Node (install http-server): `npx http-server -p 8080`
4. Open `http://localhost:8080` in your browser, orbit with mouse/touch, and click the framed thumbnail to watch the embedded video.

Notes & customization ideas
- Add more frames by calling `createFrame(...)` with different positions and video IDs.
- Replace placeholder frame borders with 3D models or richer frame textures.
- Swap the lighting or add spotlights for a more gallery-like look.
- If you'd like me to push these files into your repository, tell me which branch name you prefer and confirm you want me to commit. I can create the files and open a PR for you once the repository has an initial branch or if you ask me to push to a new branch.
```
