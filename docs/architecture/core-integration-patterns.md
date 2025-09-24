# Core Integration Patterns

## Module Communication
- **State Management**: Centralized via Zustand with module-specific stores
- **Event System**: Custom event bus for cross-module communication
- **API Layer**: Unified REST API with module-specific endpoint groups

## Data Flow Architecture
```
UI Components → Local State → Global Store → API Layer → Backend
     ↑                                                      ↓
Command System ← Event Bus ← Module Services ← Data Layer
```
