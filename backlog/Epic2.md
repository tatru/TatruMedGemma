# Epic 2: Core Chat And Offline AI Integration

## Archive Note

This is a historical backlog document from the Kaggle challenge period. It captures planning language, not current product claims.

## Overview

Develop the primary chat interface and integrate a local LLM for offline-first research/demo experimentation.

## User Stories

### US2.1: Implement Chat UI

**As a** user,
**I want** a chat interface where I can type messages and receive responses,
**So that** I can capture questions and observations clearly.

### US2.2: Integrate Local LLM (Edge AI)

**As a** user,
**I want** the app to process my text locally using a lightweight MedGemma model,
**So that** I can experiment without requiring internet access.

### US2.3: Manage Chat Sessions/History

**As a** user,
**I want** to view a list of past chat sessions and resume them,
**So that** I can revisit prior prototype conversations.

### US2.4: Implement Cloud Fallback Logic

**As a** user,
**I want** the option to route a query to a more powerful online model when I choose to do so,
**So that** I can compare local and hosted prototype behavior.

### US2.5: Quantization And Model Packaging

**As a** developer,
**I want** a reproducible workflow that produces a quantized MedGemma model suitable for mobile experimentation,
**So that** the offline mode can use a small, fast model or user-managed download.

## Progress

- Done: chat UI, session list, message transcript, and local conversation persistence.
- Done: shared inference router with manual mode selection across device, LAN, cloud, Flask, and Kaggle providers.
- Done: on-device text generation foundation via GGUF downloads plus `llama.rn`, when local model files are configured.
- Partial: hosted-mode comparison exists through explicit mode selection, but automatic device/LAN-to-cloud failover is not implemented.
- Partial: quantization and model-packaging workflow remain user-managed and are not fully reproducible from this repository alone.

## Note

Nothing in this file should be read as a claim of diagnostic accuracy, clinical safety, or healthcare readiness.
