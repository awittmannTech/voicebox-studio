# Voicebox Minimal Web Interface

A lightweight, clean, and professional web interface for the Voicebox voice cloning studio.

## Features

- **Minimal Design**: Apple-inspired light theme with focus on usability
- **Voice Profile Management**: Create, edit, and manage voice profiles
- **Speech Generation**: Convert text to speech using cloned voices
- **Generation History**: Track and manage all speech generations
- **Real-time Updates**: Live progress tracking for active generations

## Getting Started

### Prerequisites

- Backend server running on `http://localhost:17493`
- Bun package manager

### Development

```bash
# From project root
bun run dev:web

# Or from web directory
cd web
bun run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# From project root
bun run build:web

# Or from web directory
cd web
bun run build
```

Built files will be in `web/dist/`

## UI Modes

The web app supports two UI modes:

1. **Minimal UI** (default): Clean, focused interface - `http://localhost:5173`
2. **Full UI**: Complete desktop app interface - `http://localhost:5173?mode=full`

## Design System

The minimal interface follows an Apple-inspired design language:

- **Colors**: White/light gray background with iOS green (#34C759) accents
- **Typography**: System font stack (SF Pro Text on macOS)
- **Components**: Radix UI primitives with custom styling
- **Layout**: Responsive grid (desktop: 2-column, mobile: stacked)

See [Design System Documentation](../docs/DESIGN_SYSTEM.md) for detailed specifications.

## Architecture

### Components

- `MinimalApp.tsx` - Main application component
- `MinimalLayout.tsx` - Grid layout wrapper
- `MinimalHeader.tsx` - Top navigation bar
- `VoiceProfileGrid.tsx` - Voice profile management
- `GenerationInputBox.tsx` - Speech generation interface
- `JobsTable.tsx` - Generation history and active jobs
- `AudioPlayer.tsx` - Simple audio playback component

### State Management

- **React Query**: Server state and API caching
- **Zustand**: Global client state (server URL, UI state)
- **Local State**: Component-specific state (forms, dialogs)

### API Integration

All API calls use the auto-generated client from `app/src/lib/api/`:

- `DefaultService.listProfilesProfilesGet()` - Fetch voice profiles
- `DefaultService.createProfileProfilesPost()` - Create voice profile
- `DefaultService.generateSpeechGeneratePost()` - Generate speech
- `DefaultService.listHistoryHistoryGet()` - Fetch generation history

See [CLAUDE.md](../CLAUDE.md) for full API documentation.

## Customization

### Theme

Modify `web/src/styles/minimal-theme.css` to customize colors, spacing, and other design tokens.

### Components

All UI components are in `web/src/components/` and use the shared component library from `app/src/components/ui/`.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Initial load: < 2 seconds
- API response: < 500ms
- Audio playback start: < 300ms
- Auto-refresh: Every 5 seconds for active jobs

## Troubleshooting

### Backend Connection Issues

If you see "Failed to load profiles" errors:

1. Ensure backend server is running: `make dev-backend`
2. Check server URL in browser console
3. Verify `http://localhost:17493/health` returns 200 OK

### Build Errors

If TypeScript compilation fails:

1. Ensure all dependencies are installed: `bun install`
2. Check for missing type definitions
3. Verify workspace configuration in root `package.json`

## License

See [LICENSE](../LICENSE) file in project root.
