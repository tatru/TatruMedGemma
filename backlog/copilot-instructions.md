# Copilot Instructions For GemmaMed-Help

## Archive Note

This file is a historical challenge-era planning note. It describes early
prototype ideas and naming, not the current public positioning of the
repository. TatruMedGemma remains a research/demo prototype and must not be
interpreted as a medical device, diagnostic tool, or emergency response
system.

## Project Overview

This project is a React Native mobile application built with Expo for the
MedGemma Impact Challenge. The app concept explored a privacy-aware,
medical-adjacent assistant that could discuss symptoms, images, and care
escalation in a research/demo setting.

## Core Technologies

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **AI/ML:**
  - **Local/Edge AI:** smaller, quantized MedGemma-style models for local
    experimentation
  - **Cloud AI:** hosted fallback models for optional online experimentation
- **Navigation:** React Navigation
- **State management:** local app state such as Zustand or similar
- **Storage:** local storage for chat history, settings, and model metadata
- **Media:** camera, image picker, and optional audio tooling

## Historical Feature Concepts

1. **Chat interface**
   - text input
   - voice input
   - image input
   - locally stored chat history
2. **Offline-first architecture**
   - initial support for local or edge inference
3. **Symptom discussion and escalation**
   - exploratory educational output only
   - suggestions to seek qualified human care when appropriate
   - optional summary generation for user review and sharing
4. **Emergency-related ideas**
   - these were challenge-era brainstorm items only
   - they should not be interpreted as current or approved product behavior

## Coding Standards

- Use functional components and hooks.
- Follow TypeScript best practices.
- Prefer Expo libraries when practical.
- Prioritize accessible UI.
- Preserve privacy and safety boundaries appropriate for a research/demo
  prototype.

## Competition Context

- Target track: **The Edge AI Prize**
- Challenge-era requirement: use **MedGemma** or **HAI-DEF** models
- Development was organized by epics in the `backlog/` folder
