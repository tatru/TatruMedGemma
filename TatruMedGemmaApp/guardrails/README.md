# Guardrails Data Layer

This folder contains example guardrails scaffolding for TatruMedGemma's
research/demo workflow. It is not a clinical rules engine.

## Included Here

- `schema.sql`: SQLite schema for topic boundaries, escalation rules, and
  medication-related guardrails experiments
- `manifest.example.json`: example update contract for user-controlled
  manifest hosting
- `../types/guardrails.ts`: TypeScript types for manifest payloads
- `../services/guardrails/updateService.ts`: manifest fetch and validation
  scaffolding

## Design Intent

The schema is organized around:

1. scope control
2. general medical-information grounding
3. high-risk escalation checks
4. medication-related guardrails
5. source traceability

## Recommended Source Policy

- Prefer structured public-health or openly licensed sources with clear
  attribution.
- Store source metadata and checksums in `sources`.
- Treat general web content as lower trust and never as the sole basis for
  urgent or safety-critical guidance.

## Update Pipeline

1. Build a new guardrails database offline.
2. Compute SHA-256 digests for bundles.
3. Produce `manifest.json` following the same shape as
   `manifest.example.json`.
4. Optionally include:
   - `policy` for runtime allow/deny and escalation rules
   - `promptPackInline` for a versioned research/demo system prompt
5. Host the manifest and bundles on infrastructure you control.
6. Call `planGuardrailsUpdate(manifestUrl)` in the app and validate before
   applying changes.

## Safety Boundary

Guardrails in this folder are best-effort runtime controls for a prototype.
They do not make the app clinically validated, regulator-ready, or safe for
autonomous healthcare use.
