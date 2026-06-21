# Privacy And Data Flow

This document describes the current data handling behavior in the public
TatruMedGemma repository as of the checked-in code. It is not a regulatory
statement, legal opinion, or guarantee of compliance.

## Scope

TatruMedGemma is a research/demo prototype. It does not ship with a
repository-managed backend that stores conversations for all users.
However, the app does persist data locally, and configured LAN or hosted
services may receive and retain prompts or images.

## Data You May Enter Or Configure

Depending on the mode and features you enable, the app may process or store:

- text prompts and assistant responses
- conversation history
- selected medical or non-medical images
- inference mode and endpoint configuration
- API keys for hosted providers
- guardrails manifest URLs and prompt templates
- downloaded model files such as GGUF and optional mmproj files

## Local Storage In The Current Code

The current mobile app stores data locally with `AsyncStorage` and Expo file
storage:

- `chat-storage`
  - Stores up to 25 chat sessions.
  - Stores up to 120 messages per session.
  - Truncates persisted message text to 8000 characters.
  - Removes inline `data:` image payloads before persistence, but may retain
    non-inline `imageUri` references.
- `inference-storage`
  - Stores the selected inference mode.
  - Stores endpoint URLs, model IDs, API keys, guardrails settings, and
    optional MedSigLIP / MedASR configuration.
- Downloaded local model files
  - Stored in the app document directory through Expo file APIs.
  - Includes GGUF files and optional mmproj files when the user downloads
    them for on-device mode.

The repository does not currently include a dedicated "secure enclave" or
encrypted-at-rest storage layer for these values. If you need stronger
device-side protections, that requires additional implementation and review.

## Data Flow By Mode

### On-device / offline

- Prompt text is processed on-device by the `llama.rn` provider.
- The current checked-in device provider is text-only; attached image input
  is rejected in this mode.
- Model files still come from the configured download URL, which is an
  external network request.
- Chat history and settings may still be stored locally as described above.

### LAN / Ollama

- Prompt history is sent to the configured Ollama `/api/chat` endpoint.
- If an image is attached, the app converts it to base64 and sends it in the
  request payload.
- If MedSigLIP routing is enabled in LAN mode, the latest image and user
  prompt are also sent to the configured analyzer endpoint.
- Logging, retention, access control, and network exposure depend on your
  own Ollama, Flask, reverse proxy, and LAN configuration.

### Flask image analysis

- The Flask provider sends the latest prompt and optional image to the
  configured `/analyze_stream` or `/analyze` endpoint.
- Images may be sent as multipart upload or base64 JSON depending on the
  runtime and image source.
- Server-side logs, reverse proxies, debugging tools, and crash reports may
  record request metadata and errors.

### Hosted / online APIs

- The cloud provider sends prompts, message history, optional image data, and
  an authorization header to the configured OpenAI-compatible endpoint.
- The Gradio / Kaggle provider sends the latest user message plus optional
  image data to the configured hosted endpoint.
- In these modes, prompts and images may leave the device and be handled by
  third-party infrastructure that is outside this repository's control.

### Guardrails manifests and update metadata

- If you configure a guardrails manifest URL, the app fetches JSON metadata
  from that endpoint.
- Required bundle download and database swap behavior is only partially
  implemented in the checked-in prototype.

### MedASR

- MedASR configuration fields are stored locally in settings.
- Current end-to-end runtime use of MedASR requires code review; the checked
  in chat flow does not actively invoke a transcription endpoint.

## Logging, Debugging, And Crash Surfaces

- The mobile app includes a dev-oriented logger that can print system prompts
  and guardrails state in development builds.
- Mobile console logs, crash reports, screenshots, and debug tooling can
  expose prompts, endpoint URLs, or other sensitive context.
- The Flask API logs request metadata and errors. Server operators should
  review logging and retention settings before processing sensitive content.

## What This Repository Does Not Guarantee

This repository does not guarantee:

- that data never leaves the device
- that any selected provider is private by default
- that third-party services do not log, cache, or retain requests
- that local device storage is encrypted or tamper resistant
- that the system is compliant with HIPAA, GDPR, or any other regulatory
  framework

## Practical Guidance

- Use synthetic, de-identified, or demo data whenever possible.
- Do not use real patient data unless you have legal authority, required
  consent, and appropriate technical and organizational safeguards.
- Review endpoint terms, telemetry, logs, retention, and transport security
  before enabling LAN or hosted modes.
- Avoid sharing screenshots, crash logs, exported chats, or issue reports
  that include health information or identifiable images.

See also [docs/SAFETY.md](docs/SAFETY.md) and [SECURITY.md](SECURITY.md).
