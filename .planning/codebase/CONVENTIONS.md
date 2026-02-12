# Coding Conventions

**Analysis Date:** 2026-02-09

## Naming Patterns

**Files:**
- Components: PascalCase for `.tsx` files (e.g., `VoicesTab.tsx`, `GenerationForm.tsx`)
- Hooks: camelCase prefix with `use` (e.g., `useGeneration.ts`, `useProfiles.ts`)
- Utilities: camelCase (e.g., `format.ts`, `cn.ts`)
- Stores: camelCase suffix with `Store` (e.g., `generationStore.ts`, `serverStore.ts`)
- Python modules: snake_case (e.g., `audio.py`, `profiles.py`)
- Python tests: `test_*.py` or `*_test.py` (e.g., `test_progress.py`)

**Functions:**
- TypeScript: camelCase, descriptive names
  - Hooks: `useGeneration()`, `useProfiles()`, `useAddSample()`
  - Utils: `formatDuration()`, `formatFileSize()`, `formatDate()`
  - Getters in stores: `setIsGenerating()`, `setServerUrl()`
- Python: snake_case (e.g., `create_profile()`, `add_profile_sample()`, `load_audio()`)
- API routes in FastAPI: snake_case (e.g., `/generate`, `/profiles`, `/generate-speech`)

**Variables:**
- TypeScript: camelCase (e.g., `selectedProfileId`, `isGenerating`, `generationStartTime`)
- Python: snake_case (e.g., `profile_id`, `reference_text`, `audio_path`)
- Constants: UPPER_SNAKE_CASE (e.g., `LANGUAGE_OPTIONS` in `app/src/lib/constants/languages.ts`)
- React state hooks: camelCase with clear prefixes (e.g., `isPaused`, `isConnected`, `hasError`)

**Types:**
- Interface/Type names: PascalCase (e.g., `ServerStore`, `GenerationState`, `ShinyTextProps`)
- Generic params: Single uppercase letters (e.g., `T`, `K`, `V`)
- Pydantic models: PascalCase with descriptive suffixes
  - Request: `VoiceProfileCreate`, `GenerationRequest`
  - Response: `VoiceProfileResponse`, `GenerationResponse`
  - Update: `ProfileSampleUpdate`, `AudioChannelUpdate`

## Code Style

**Formatting:**
- Tool: Biome (`@biomejs/biome` v2.3.12)
- Indent: 2 spaces
- Line width: 100 characters
- Semicolons: Always required
- Trailing commas: All (in multi-line arrays/objects)

**Linting:**
- Tool: Biome with recommended rules enabled
- Quote style: Single quotes for JS, double quotes for JSX attributes
- Arrow function parentheses: Always required (e.g., `(param) =>`, not `param =>`)
- Unused imports: Error (enforced with `noUnusedImports: "error"`)
- Unused variables: Warning (enforced with `noUnusedVariables: "warn"`)

**Key Rules:**
- `noDoubleEquals: "error"` - Must use `===` and `!==`
- `useHookAtTopLevel: "error"` - React hooks must be at component top
- `noExplicitAny: "warn"` - Avoid `any` type
- `noNonNullAssertion: "off"` - Non-null assertions allowed (using `!`)
- `useFilenamingConvention: "off"` - File naming not enforced via Biome

**TypeScript Compiler:**
- Target: ES2020
- Strict mode: Enabled
- No emit: True (Vite handles build)
- JSX: react-jsx automatic runtime
- Module resolution: bundler
- noUnusedLocals: true
- noUnusedParameters: true

## Import Organization

**Order:**
1. External packages (React, third-party libraries)
2. Internal absolute imports (using `@/` alias)
3. Relative imports (not typically used due to alias)

**Examples:**
```typescript
// First: React and major frameworks
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Second: Internal imports with @/ alias
import { apiClient } from '@/lib/api/client';
import type { GenerationRequest } from '@/lib/api/types';
import { useServerStore } from '@/stores/serverStore';
import { Button } from '@/components/ui/button';
```

**Path Aliases:**
- `@/*` → `./src/*` (defined in `app/tsconfig.json`)
- Used for all imports within `app/` workspace
- Prevents relative path chains like `../../components/ui/button`

## Error Handling

**TypeScript/Frontend:**
- No explicit try-catch in most components (React Query handles async errors)
- Error handling delegated to React Query's `onError` callbacks or error states
- HTTPException errors from backend are automatically parsed by API client
- Component-level error boundaries not explicitly implemented (global error handling via API client)

**Python/Backend:**
- FastAPI HTTPException used throughout
- Status codes map to error types:
  - `400`: Validation errors, ValueError for invalid inputs
  - `404`: Resource not found (Profile, Sample, Generation)
  - `500`: Unexpected server errors
- Pattern: Validate input, raise HTTPException if invalid, otherwise process
  ```python
  @app.post("/profiles/{profile_id}/samples")
  async def add_profile_sample(...):
      try:
          # Validation
          db_profile = db.query(...).filter(...).first()
          if not db_profile:
              raise HTTPException(status_code=404, detail="Profile not found")
          # Process
          return result
      except ValueError as e:
          raise HTTPException(status_code=400, detail=str(e))
      except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))
  ```

**Docstrings:**
- Python functions use triple-quoted docstrings with Args/Returns sections
- TypeScript uses inline comments for complex logic or browser-specific code
- JSDoc comments (/** */) used in library/utility functions

## Comments

**When to Comment:**
- Complex animation logic (e.g., ShinyText.tsx with yoyo animation timing)
- Non-obvious business logic (date parsing edge cases, audio normalization math)
- Browser/platform-specific workarounds
- Inline comments only; avoid obvious comment redundancy

**JSDoc/TSDoc:**
- Not consistently used in frontend components
- Used in Python backend for docstrings with Args/Returns
- TypeScript function parameters typed directly; comments used only for clarification

**Example:**
```typescript
// ShinyText.tsx - Animation goes from 0 to 100
if (yoyo) {
  const cycleDuration = animationDuration + delayDuration;
  // Forward animation: 0 -> 100
  if (cycleTime < animationDuration) {
    const p = (cycleTime / animationDuration) * 100;
    progress.set(directionRef.current === 1 ? p : 100 - p);
  }
}
```

```python
# profiles.py
async def create_profile(
    data: VoiceProfileCreate,
    db: Session,
) -> VoiceProfileResponse:
    """
    Create a new voice profile.

    Args:
        data: Profile creation data
        db: Database session

    Returns:
        Created profile
    """
```

## Function Design

**Size:**
- Keep functions under 50 lines when practical
- Hook functions: Typically 5-15 lines (wrap React Query usage)
- Component functions: 100-300 lines (layout, form handling)
- Python utility functions: 10-30 lines, helper functions shorter

**Parameters:**
- TypeScript functions: Use type annotations, avoid `any`
- Destructured object params for multiple related arguments
  ```typescript
  // Good: Named parameters
  export function useAddSample() {
    return useMutation({
      mutationFn: ({
        profileId,
        file,
        referenceText,
      }: { profileId: string; file: File; referenceText: string }) =>
        apiClient.addProfileSample(profileId, file, referenceText),
    });
  }
  ```
- Python: Type hints required, default values use `=` assignment

**Return Values:**
- React hooks return query/mutation objects (TanStack React Query)
- Utility functions return typed values with clear semantics
- Python async functions return Pydantic models or lists of models
- Empty/null handling: Explicit checks, not relying on truthiness

## Module Design

**Exports:**
- Single default export for components
  ```typescript
  export default ShinyText;
  ```
- Named exports for utilities and hooks
  ```typescript
  export function useGeneration() { ... }
  export function useCreateProfile() { ... }
  ```
- Python: Module functions are functions, classes for data models

**Barrel Files:**
- Not used in current codebase
- Components imported directly: `import Button from '@/components/ui/button'`
- Hooks imported from individual files: `import { useProfiles } from '@/lib/hooks/useProfiles'`

**Store Pattern (Zustand):**
- Single `create<StateType>()` call per store file
- Optional persist middleware for localStorage
- Getters and setters in same object structure
  ```typescript
  export const useServerStore = create<ServerStore>()(
    persist(
      (set) => ({
        serverUrl: 'http://127.0.0.1:17493',
        setServerUrl: (url) => set({ serverUrl: url }),
        isConnected: false,
        setIsConnected: (connected) => set({ isConnected: connected }),
      }),
      { name: 'voicebox-server' },
    ),
  );
  ```

## React Patterns

**Component Structure:**
- Functional components with hooks exclusively
- Props interface defined above component
- Component returned at bottom with displayName for debugging
  ```typescript
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
    return <button className={cn(className)} ref={ref} {...props} />;
  });
  Button.displayName = 'Button';
  export { Button };
  ```

**Hook Usage:**
- React Query for async server state (`useQuery`, `useMutation`)
- Zustand for global UI state
- React hook-form with Zod validation for forms
- Built-in React hooks (useState, useEffect, useCallback) as needed

**Form Handling:**
- react-hook-form with Zod validators
- Form components from Radix UI design system
- Pattern: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
  ```typescript
  <FormField
    control={form.control}
    name="text"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Text to Speak</FormLabel>
        <FormControl>
          <Textarea {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  ```

## Python Backend Patterns

**Module Organization:**
- Main entry: `backend/main.py` with all FastAPI routes
- Business logic in domain modules: `profiles.py`, `history.py`, `tts.py`, `transcribe.py`
- Data models: `backend/models.py` (Pydantic)
- Database layer: `backend/database.py` (SQLAlchemy ORM)
- Utilities: `backend/utils/` directory

**Pydantic Models:**
- BaseModel inherited for all request/response types
- Field() for validation (min_length, max_length, pattern, ge/le)
- Config class for ORM-friendly parsing: `from_attributes = True`
  ```python
  class GenerationResponse(BaseModel):
      id: str
      profile_id: str
      text: str
      language: str

      class Config:
          from_attributes = True
  ```

**Async Functions:**
- Async functions return awaitable Pydantic models or lists
- Used in FastAPI route handlers
- Pattern: Route → async handler → business logic module → DB/process

**Logging:**
- Python logging module configured at test level
- Used in test scripts for debugging
- Backend operations logged via print/logging (not exposed in response)

---

*Convention analysis: 2026-02-09*
