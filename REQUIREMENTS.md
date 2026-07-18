# Requirements

## Window Behavior
- The app window must be draggable using the mouse.
- The app window must be draggable between displays (for example, from one screen to another).

## Settings Page
- The app must provide a settings entry point from the main UI.
- The settings page must allow the user to select a local project folder.
- The selected project path must be shown clearly in the settings UI.
- The settings page must allow the user to enter an Ollama server URL.
- The app must fetch available Ollama models through typed preload and main-process IPC.
- Returned Ollama model names must be displayed clearly in the settings UI.
- The settings page must show useful errors when project-path selection fails, the Ollama URL is invalid, or the Ollama server cannot be reached.

## Acceptance Criteria
- When the user clicks and drags the app window from the title bar area, the window follows mouse movement.
- The user can move the app window from the current display to another connected display without freezing or losing focus.
- Dragging behavior works on macOS in both normal and maximized window states where applicable.
- The user can open the settings page from the main app UI and return to the dashboard.
- The user can open a native folder picker from settings and select a project directory.
- After folder selection, the chosen project path is displayed in the settings page.
- If folder selection fails, the settings page shows a user-facing error message.
- The user can enter an Ollama server URL and request available models.
- When the Ollama request succeeds, returned model names are shown in the settings page.
- When the Ollama URL is invalid, the server is unreachable, or the request times out, the settings page shows a user-facing error message.
- Renderer access for project-path selection and Ollama model discovery is routed through preload and main-process boundaries.
