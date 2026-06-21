# Safety Notes

TatruMedGemma is a research/demo prototype. It is not a medical device and
must not be treated as clinically reliable.

## Known Limitations

- hallucinations or fabricated details
- false reassurance or understated risk
- missed critical findings
- incorrect image interpretation
- outdated knowledge or stale references
- prompt injection and instruction-following failures
- bias, uneven performance, and demographic limitations
- unsafe self-treatment or medication suggestions
- inconsistent behavior across on-device, LAN, and hosted modes

## Recommended Mitigations

- require human expert review before acting on outputs
- do not use the system for emergency situations
- do not use it for unsupervised clinical or patient-facing workflows
- prefer synthetic or demo data
- clearly label outputs as AI-generated
- require explicit user confirmation before acting on any advice
- review and constrain prompts, guardrails, and endpoint settings
- review model/provider terms, logs, retention, and access controls

## Medical Image Caution

Image-related output from this repository may be wrong, incomplete,
non-specific, or misleading. It must not be presented as a radiology read,
diagnosis, or clinically validated interpretation.

## Prompt And Tooling Risks

- Hosted or LAN endpoints may follow hidden system prompts or external
  policies that differ from this repo.
- User-provided prompts or image captions may steer the model toward unsafe
  conclusions.
- Debugging output, screenshots, and logs may expose sensitive content.

## Red Lines

- no clinical diagnosis
- no treatment prescription
- no emergency triage
- no autonomous medical decision-making
- no claims of regulatory approval
