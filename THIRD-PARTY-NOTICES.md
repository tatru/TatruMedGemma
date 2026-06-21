# Third-Party Notices

This file summarizes the direct JavaScript dependencies declared in
`TatruMedGemmaApp/package.json` and resolved in
`TatruMedGemmaApp/package-lock.json`.

The repository's MIT license applies to this repository's own code only. It
does not relicense third-party packages, services, model artifacts, datasets,
or hosted endpoints.

## Direct Runtime Dependencies

| Package | Resolved version | License | Notes |
| --- | --- | --- | --- |
| `@expo/vector-icons` | `15.0.3` | `MIT` | Icon set used by the Expo app. |
| `@react-native-async-storage/async-storage` | `2.2.0` | `MIT` | Local settings and chat persistence. |
| `@react-navigation/bottom-tabs` | `7.14.0` | `MIT` | Tab navigation. |
| `@react-navigation/elements` | `2.9.5` | `MIT` | Navigation UI primitives. |
| `@react-navigation/native` | `7.1.28` | `MIT` | Core navigation container. |
| `expo` | `54.0.33` | `MIT` | Expo runtime and app tooling. |
| `expo-constants` | `18.0.13` | `MIT` | Runtime constants. |
| `expo-file-system` | `19.0.21` | `MIT` | Local file and model storage. |
| `expo-font` | `14.0.11` | `MIT` | Font loading. |
| `expo-haptics` | `15.0.8` | `MIT` | Haptic feedback. |
| `expo-image` | `3.0.11` | `MIT` | Image rendering. |
| `expo-image-picker` | `17.0.10` | `MIT` | Camera and gallery selection. |
| `expo-linking` | `8.0.11` | `MIT` | Deep linking helpers. |
| `expo-router` | `6.0.23` | `MIT` | File-based routing. |
| `expo-speech` | `14.0.8` | `MIT` | Text-to-speech output. |
| `expo-splash-screen` | `31.0.13` | `MIT` | Splash screen integration. |
| `expo-status-bar` | `3.0.9` | `MIT` | Status bar integration. |
| `expo-symbols` | `1.0.8` | `MIT` | Symbol support. |
| `expo-system-ui` | `6.0.9` | `MIT` | System UI helpers. |
| `expo-web-browser` | `15.0.10` | `MIT` | Web browser integration. |
| `llama.rn` | `0.11.2` | `MIT` | On-device GGUF inference binding. |
| `react` | `19.1.0` | `MIT` | UI framework. |
| `react-dom` | `19.1.0` | `MIT` | Web rendering. |
| `react-native` | `0.81.5` | `MIT` | Mobile runtime. |
| `react-native-gesture-handler` | `2.28.0` | `MIT` | Touch and gesture handling. |
| `react-native-get-random-values` | `1.11.0` | `MIT` | Random values polyfill. |
| `react-native-markdown-display` | `7.0.2` | `MIT` | Markdown rendering for chat content. |
| `react-native-reanimated` | `4.1.6` | `MIT` | Animation support. |
| `react-native-safe-area-context` | `5.6.2` | `MIT` | Safe area handling. |
| `react-native-screens` | `4.16.0` | `MIT` | Native screen primitives. |
| `react-native-web` | `0.21.2` | `MIT` | Web target support. |
| `react-native-worklets` | `0.5.1` | `MIT` | Worklets support. |
| `zustand` | `5.0.11` | `MIT` | Client state management. |

## Direct Development Dependencies

| Package | Resolved version | License | Notes |
| --- | --- | --- | --- |
| `@types/react` | `19.1.17` | `MIT` | React TypeScript types. |
| `eslint` | `9.39.2` | `MIT` | Linting. |
| `eslint-config-expo` | `10.0.0` | `MIT` | Expo lint configuration. |
| `typescript` | `5.9.3` | `Apache-2.0` | TypeScript compiler. |

## External Service And Model Boundaries

The following are not licensed by this repository and remain subject to
their own terms:

- MedGemma / Gemma model weights, tokenizers, processor files, and model
  cards
  - Upstream examples referenced in code:
    `google/medgemma-1.5-4b-it` and
    `unsloth/medgemma-4b-it-GGUF`
  - Review the upstream model page and license before downloading or use.
- Hugging Face
  - Model hosting, direct file downloads, repository terms, and gated-access
    behavior remain subject to Hugging Face and the upstream publisher.
- Ollama and LAN inference
  - Ollama itself, the model you serve through it, and any LAN proxy or
    server configuration remain your responsibility.
- Gradio / Kaggle / other hosted demo endpoints
  - Hosted endpoints may be third-party infrastructure with separate logging,
    retention, and acceptable-use terms.
- OpenAI-compatible or other hosted APIs
  - User-supplied cloud endpoints, billing, logging, telemetry, retention,
    and terms are external to this repository.
- Optional image or speech services
  - MedSigLIP and MedASR endpoints are user configured and may have their own
    licensing, privacy, and safety constraints.

## Separate Python Dependency Review

This notice file summarizes the direct JavaScript dependencies backed by
`TatruMedGemmaApp/package-lock.json`. Python dependencies for the Flask API
are declared separately in `MedGemmaFlaskAPI/requirements-api.txt` and
`MedGemmaFlaskAPI/environment.yml` and should be reviewed independently.
