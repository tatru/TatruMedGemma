# Epic 5: Multi-Tier AI Services (Device, LAN, Cloud)

## Overview
Implement a multi-mode inference architecture so users can run the prototype on-device, via LAN services, or via hosted endpoints, with clear mode selection and connectivity status.

## User Stories

### US5.1: Select Inference Mode
**As a** user,
**I want** to choose between On-device, LAN, and Cloud modes,
**So that** I can balance privacy, speed, and capability.

### US5.2: Route Chat Through Active Provider
**As a** user,
**I want** chat responses to use my selected mode automatically,
**So that** I get consistent behavior without manual endpoint switching.

### US5.3: Persist Provider Settings
**As a** user,
**I want** my provider settings (LAN URL/model, cloud endpoint/model/key, device model metadata) to persist,
**So that** I do not reconfigure the app every time.

### US5.4: Provider Health Visibility
**As a** user,
**I want** a connection status indicator for the active provider,
**So that** I know whether the selected service is currently reachable.

### US5.5: On-Device Runtime Foundation
**As a** developer,
**I want** an explicit on-device provider abstraction and runtime safeguards,
**So that** native inference integration can be added safely without rewriting chat flows.

(Implemented in the current prototype: the local provider now loads GGUF files, performs text generation via `llama.rn`, and is selectable alongside LAN and hosted modes.)

### US5.6: Curated MedGemma Catalog
**As a** user,
**I want** to browse supported MedGemma variants with size and compatibility metadata,
**So that** I can pick a model my phone can handle.

### US5.7: Model Download and Verification
**As a** user,
**I want** resumable model downloads with integrity checks,
**So that** local model setup is reliable and safe.

(Current status: resumable download and manifest logic are implemented; end-to-end checksum enforcement is still incomplete.)

### US5.8: Cloud Failover Policy
**As a** user,
**I want** optional fallback from Device/LAN to Cloud when local inference is unavailable,
**So that** I can still receive responses during interruptions.

### US5.9: Bug Fix
**As a** user,
**I want** the app to handle errors related to OOM (Out of Memory) on LLM inference gracefully
**So that** I can continue using the app without crashes.
Link to issue: https://github.com/asierraserna/TatruMedGemma/issues/5

#### Technical notes (OOM mitigation)
On-device runtime is sensitive to available RAM. The current device provider uses conservative defaults, trims recent history before prompt construction, and performs memory checks before trying to initialize `llama.rn`.

Settings now expose `n_ctx`, `n_batch`, and `use_mlock` directly instead of relying on older preset language. The app also warns on lower-memory devices when switching into device mode, and the provider attempts an Android `/proc/meminfo` read when available before starting inference.

## Initial Delivery Scope (Historical MVP planning)
- Provider abstraction and router.
- LAN provider (Ollama) integration.
- Cloud provider (OpenAI-compatible API) integration.
- On-device provider foundation.
- Persisted inference mode and provider settings.
- Active-provider status shown on home screen.

## Progress Snapshot
- Done: US5.1. Inference mode selection is implemented in settings.
- Done: US5.2. The active mode routes chat requests through the shared provider router.
- Done: US5.3. Provider settings persist locally and are editable in-app.
- Done: US5.4. Active-provider health checks and status messaging are implemented.
- Done: US5.5. On-device inference works end-to-end for text-only prompts when GGUF files are present and compatible.
- Not done: US5.6. There is no curated in-app MedGemma compatibility catalog yet.
- Partial: US5.7. GGUF and `mmproj` downloads support resumable progress, disk-space checks, manifest-based file tracking, cancellation, and clearing. Full checksum verification is still pending.
- Not done: US5.8. Automatic device/LAN-to-cloud failover is not implemented. Hosted modes are available through explicit user selection instead.
- Partial: US5.9. OOM mitigation exists through conservative defaults, memory warnings, and runtime checks, but low-memory failures can still occur on constrained devices.
- Done: chat composer keyboard handling was fixed for iOS and Android.
- Done: multimodal image attachment exists in chat.
- Done: MedSigLIP configuration fields exist and optional LAN pre-analysis is wired into the LAN route.
- Partial: MedASR configuration fields exist, but there is no audio capture or transcription UX yet.
- Done: guardrails data scaffold exists, including schema assets, manifest contract types, and update-service plumbing.
