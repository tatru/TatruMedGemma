# Contributing

Contributions are welcome. The Kaggle MedGemma Impact Challenge is over, but
the repository remains public for responsible open-source continuation,
learning, and experimentation.

## Project Positioning

All contributions must preserve the repository's current positioning:

- research/demo prototype
- non-clinical and non-diagnostic
- not a medical device
- not suitable for emergency use or autonomous care decisions

## Do Not Submit Restricted Or Sensitive Content

Do not contribute:

- real patient data or personal health information
- identifiable medical images
- proprietary datasets or restricted clinical material
- private model credentials, tokens, or endpoint secrets
- third-party confidential content

Use synthetic, de-identified, or openly redistributable demo material.

## AI-Assisted Contributions

If a change was created or materially edited with AI assistance, disclose
that in the pull request description. Include enough detail for reviewers to
understand what was AI-assisted and what you verified manually.

## Expectations For New Integrations

If you add or change a model, provider, endpoint, or external service,
document:

- data flow and where prompts/images go
- license terms and upstream access requirements
- safety implications and known limitations
- any new storage, logging, or telemetry behavior

## Documentation And Safety

Please update documentation when behavior changes affect:

- privacy or data flow
- public-facing safety boundaries
- model download defaults
- external service assumptions
- setup instructions or compatibility notes

Do not introduce language implying:

- clinical validation
- diagnostic reliability
- regulatory approval
- HIPAA/GDPR compliance
- doctor replacement or emergency suitability

## Suggested Pull Request Checklist

- no secrets or private data added
- no bundled weights or restricted artifacts added without clear rights
- safety and privacy docs updated if needed
- user-facing wording stays clearly non-clinical
- new config defaults are generic and public-safe
