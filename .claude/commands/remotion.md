Set up Remotion for programmatic video generation in React.

What video to create: $ARGUMENTS

Steps:
1. Install Remotion: `npm install remotion @remotion/cli @remotion/player`
2. Create the video composition structure:
   - src/remotion/Root.tsx - Register all compositions
   - src/remotion/Video.tsx - Main video component
   - src/remotion/sequences/ - Individual scenes

3. Build the composition with:
   - useCurrentFrame() and useVideoConfig() hooks
   - <Sequence> for timeline-based scenes
   - spring() for smooth animations
   - interpolate() for value mapping across frames
   - <Audio> and <Video> for media

4. Add to package.json:
   ```json
   "scripts": {
     "remotion:preview": "remotion preview src/remotion/index.ts",
     "remotion:render": "remotion render src/remotion/index.ts VideoName out/video.mp4"
   }
   ```

5. Create remotion.config.ts with codec settings

Example composition structure for the requested video, with proper typing and 30fps/1080p defaults.

Output the full file structure and runnable code.
