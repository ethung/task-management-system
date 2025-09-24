<!-- BMAD-READY: Sharded Architecture Document -->
<!-- SHARD-TYPE: master-index -->
<!-- SHARD-DEPENDENCIES: architecture/tech-stack.md, architecture/frontend.md, architecture/api.md, architecture/commands.md, architecture/future.md -->

# Architecture Overview
*Shard-ready modular architecture for Weekly Planning and Career Wins App*

## BMad Orchestrator Integration
This document is prepared for BMad orchestrator sharding with the following structure:
- **Master Index**: This file serves as navigation hub
- **Modular Shards**: Each section can be loaded independently via BMad commands
- **Cross-References**: Links maintain coherence across sharded components

## Document Structure
This architecture document is designed for modular consumption and can be sharded into focused components:

- **Core Architecture** (this document): High-level system design and integration patterns
- **Technology Stack**: Detailed technology choices and rationale → `architecture/tech-stack.md`
- **Frontend Architecture**: Component organization and data flow → `architecture/frontend.md`
- **API Structure**: Backend endpoints and communication patterns → `architecture/api.md`
- **Command System**: Keyboard-first interface implementation → `architecture/commands.md`
- **Future Considerations**: Scalability and enhancement roadmap → `architecture/future.md`

## System Overview
The application follows a **modular, component-based architecture** designed for:
- **Scalability**: Each module can be developed and deployed independently
- **Maintainability**: Clear separation of concerns and well-defined interfaces
- **Extensibility**: New features can be added without affecting existing modules

## Core Integration Patterns

### Module Communication
- **State Management**: Centralized via Zustand with module-specific stores
- **Event System**: Custom event bus for cross-module communication
- **API Layer**: Unified REST API with module-specific endpoint groups

### Data Flow Architecture
```
UI Components → Local State → Global Store → API Layer → Backend
     ↑                                                      ↓
Command System ← Event Bus ← Module Services ← Data Layer
```

## Quick Reference Links
- Technology decisions: → `architecture/tech-stack.md`
- Component organization: → `architecture/frontend.md`
- API endpoints: → `architecture/api.md`
- Command palette: → `architecture/commands.md`
- Roadmap items: → `architecture/future.md`

## BMad Command Integration
When working with BMad orchestrator, use these commands to access specific shards:
- `*doc architecture/tech-stack.md` - Load technology stack details
- `*doc architecture/frontend.md` - Load frontend architecture specifics
- `*doc architecture/api.md` - Load API structure and endpoints
- `*doc architecture/commands.md` - Load command system implementation
- `*doc architecture/future.md` - Load future considerations and roadmap

## Shard Status
- ✅ **Master Index**: Ready (this document)
- 🔄 **Dependencies**: Require creation (`architecture/*.md` files)
- 📋 **Integration**: BMad-compatible metadata added

---
*This document serves as the entry point to the complete architecture specification. Each linked module provides detailed implementation guidance for its respective domain.*

<!-- BMAD-FOOTER: Document prepared for modular consumption via BMad orchestrator -->
<!-- LAST-UPDATED: 2025-09-23 -->
<!-- READY-FOR-SHARDING: true -->
