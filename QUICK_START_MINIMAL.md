# Quick Start - Minimal Web Interface

Get the minimal voice cloning web interface up and running in 5 minutes.

## Prerequisites

- **Backend server** ready to run
- **Bun** package manager installed

## Step 1: Install Dependencies

```bash
# From project root
bun install
```

This will install all dependencies for the workspace, including the web app.

## Step 2: Start the Backend Server

Open a terminal and run:

```bash
# Option 1: Using Make (macOS/Linux)
make dev-backend

# Option 2: Manual (any OS)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 17493
```

The backend should be running at `http://localhost:17493`

Verify it's working: Open `http://localhost:17493/docs` in your browser

## Step 3: Start the Web App

Open a **new terminal** and run:

```bash
# Option 1: Using Make (macOS/Linux)
make dev-web

# Option 2: Using npm/bun script (any OS)
bun run dev:web

# Option 3: Direct (any OS)
cd web
bun run dev
```

The web app should start at `http://localhost:5173`

## Step 4: Open the App

Navigate to: **http://localhost:5173**

You should see the minimal voice cloning interface with:
- Voice Profiles section on the left
- Generation Input Box on the right
- Jobs Table below

## First-Time Workflow

### 1. Create a Voice Profile

1. Click the "+ Create Profile" button
2. Enter a name (e.g., "My Voice")
3. Select a language (default: English)
4. (Optional) Add a description
5. Click "Click to upload audio files" and select 2-3 audio samples
   - Audio files should be clear recordings of the voice you want to clone
   - WAV, MP3, or other common audio formats work
   - Each sample should be 3-10 seconds long
6. Click "Create Profile"

### 2. Generate Speech

1. Select your newly created profile from the dropdown
2. Enter some text in the textarea (e.g., "Hello, this is a test of voice cloning.")
3. Choose a model size (1.7B recommended for better quality)
4. Click "Generate Speech"
5. Watch the status in the Jobs Table below

### 3. Play the Result

1. Once generation is complete (status shows "Done"), click the play icon in the Jobs Table
2. Click the download icon to save the audio file

## Troubleshooting

### "Failed to load profiles" Error

**Cause**: Backend server not running or not accessible

**Fix**:
1. Check that backend is running: `curl http://localhost:17493/health`
2. If not running, start it (see Step 2)
3. Refresh the web page

### "Generation failed" Error

**Cause**: Model not downloaded yet or insufficient resources

**Fix**:
1. First generation may take longer as models download (~2-4GB)
2. Check backend logs for errors
3. Ensure you have enough disk space and RAM

### Port Already in Use

**Backend (17493)**:
```bash
# Find and kill the process
lsof -ti:17493 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :17493   # Windows (find PID, then taskkill /PID <pid> /F)
```

**Web (5173)**:
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173   # Windows (find PID, then taskkill /PID <pid> /F)
```

### TypeScript Errors

If you see TypeScript errors during development:

```bash
# Reinstall dependencies
bun install

# Clear cache
rm -rf node_modules
bun install
```

## UI Modes

### Minimal UI (Default)
Clean, focused interface optimized for voice cloning workflow.

**URL**: `http://localhost:5173`

### Full UI
Complete desktop app interface with all features.

**URL**: `http://localhost:5173?mode=full`

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus text input (when available)
- **Ctrl/Cmd + Enter**: Submit form (in dialogs)
- **Escape**: Close dialog/modal

## Production Build

To build for production:

```bash
# From project root
bun run build:web

# Or from web directory
cd web
bun run build
```

Built files will be in `web/dist/`

To preview the production build:

```bash
cd web
bunx serve dist
```

Then open `http://localhost:3000`

## Next Steps

- Explore the [Design System](docs/DESIGN_SYSTEM.md)
- Read the [Full Documentation](web/README.md)
- Review the [Implementation Summary](MINIMAL_WEB_IMPLEMENTATION.md)
- Check [CLAUDE.md](CLAUDE.md) for project architecture

## Getting Help

- **Backend API**: `http://localhost:17493/docs` (interactive API documentation)
- **Issues**: Create an issue in the project repository
- **Logs**: Check browser console (F12) for frontend errors, terminal for backend errors

---

**Enjoy the minimal voice cloning interface!**
