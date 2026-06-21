# Security Policy

TatruMedGemma is a public research/demo repository. Please report security
issues responsibly and do not disclose sensitive details in public issues or
pull requests.

## Reporting A Security Issue

- Prefer GitHub private vulnerability reporting if it is enabled for this
  repository.
- If private vulnerability reporting is not available, contact the
  maintainer privately through GitHub and request a non-public channel before
  sharing details.
- Do not post exploit steps, secrets, or sensitive samples in a public
  issue.

## Please Do Not Submit Sensitive Data

Never commit, upload, or paste into issues, pull requests, screenshots, or
logs:

- API keys, tokens, or endpoint secrets
- private model credentials or gated model access material
- real patient data, personal health information, or identifiable medical
  images
- proprietary datasets, internal clinical material, or confidential third
  party content

## Repository-Specific Risks

- LAN, Flask, Ollama, Gradio, and hosted API endpoints are configured by the
  user and may expose prompts or images if misconfigured.
- The mobile app stores chats and settings locally; debug builds, logs, and
  crash reports may expose sensitive content.
- Server operators are responsible for authentication, TLS, firewalling,
  logging, retention, and access control on any LAN or hosted inference
  service.
- Public issue threads must not contain personal health information or
  identifiable medical images.

## Hardening Guidance

- Keep model artifacts and secrets out of git.
- Treat local model directories, downloaded GGUF files, and cached images as
  sensitive.
- Review server logs and reverse proxy logs before processing any sensitive
  prompts or images.
- Disable unnecessary debugging and verbose logging in environments that may
  touch real-world data.

## Scope

This policy is best-effort for an open-source prototype. It does not imply a
formal support SLA, bug bounty, or certification program.
