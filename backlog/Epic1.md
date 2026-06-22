# Epic 1: Project Setup and Infrastructure

## Overview
Establish the foundational structure of the React Native Expo application, including navigation, state management, and local persistence.

## User Stories

### US1.1: Initialize Expo Project
**As a** developer,
**I want** to initialize a new Expo project with TypeScript,
**So that** I have a stable, type-safe development environment.

### US1.2: Implement Navigation Structure
**As a** user,
**I want** to navigate between a Home/Dashboard screen and a Chat screen,
**So that** I can easily access the core functionality.

### US1.3: Set Up Local Storage (Persistence)
**As a** user,
**I want** my chat history and preferences to be saved on my device,
**So that** I can review past conversations even when offline.

### US1.4: Define Basic UI/Theme
**As a** user,
**I want** a clean, consistent, and accessible interface,
**So that** I can use the prototype without unnecessary UI friction.

### US1.5: Improve manifest processing so it can contain guardrails and system instructions, and those settings can influence assistant behavior
**As a** developer,
**I want** to enhance the manifest file to include guardrails and system instructions,
**So that** I can control the behavior of the assistant more effectively and keep those controls transparent in the public repository.

## Progress

- Done: US1.1. Project created with Expo/TypeScript; codebase lives in `TatruMedGemmaApp/`.
- Done: US1.2. Navigation stack and tab layout are implemented.
- Done: US1.3. Chat sessions and inference settings persist locally via Zustand plus `AsyncStorage`. SQLite assets exist for guardrails/update scaffolding, but SQLite is not the primary runtime store for app state.
- Done: US1.4. Theme constants and shared UI components are in place. The current visual system is consistent and usable, but still prototype-grade rather than a polished design system.
- Partial: US1.5. Guardrails/system-instruction fields, prompt templates, and manifest update plumbing are present. Runtime behavior is influenced by stored prompt and guardrails configuration, but this remains a lightweight prototype implementation.
