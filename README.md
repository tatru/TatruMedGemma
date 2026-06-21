# TatruMedGemma

TatruMedGemma is a research and demonstration prototype created for the
[Kaggle MedGemma Impact Challenge](https://www.kaggle.com/competitions/med-gemma-impact-challenge/overview).
It explores a privacy-aware mobile UX for medical-adjacent AI across
on-device, LAN, and hosted inference modes.

> Medical safety disclaimer
>
> TatruMedGemma is a research and demonstration prototype. It is not a
> medical device, not a diagnostic system, and not a substitute for
> qualified medical advice, diagnosis, treatment, or emergency care.
> Model outputs may be inaccurate, incomplete, biased, or unsafe. Do not
> rely on this project for clinical decisions. Any medical or image-related
> output must be reviewed by qualified professionals.

The Kaggle challenge submission period is over. This repository remains
public for learning, reproducibility, experimentation, and responsible
open-source continuation. Minor stability fixes were applied after the
challenge deadline on February 25, 2026 to keep the demo paths and repo
usable; no claim is made that those post-deadline changes were part of
Kaggle evaluation. See [Open Source Status](docs/OPEN-SOURCE-STATUS.md).

## What This Repository Contains

- `TatruMedGemmaApp/`: Expo / React Native client with on-device, LAN,
  Flask, and hosted Gradio routing.
- `MedGemmaFlaskAPI/`: experimental Flask service for text and image
  requests against MedGemma-style models.
- `MedGemmaKaggleGradioAPI/`: Kaggle / Gradio notebook prototype used
  during challenge work.
- `TatruMedGemmaApp/guardrails/`: example manifest and schema scaffolding
  for non-clinical guardrails experiments.

## Quick Start

### 1. Clone the repository

```sh
git clone https://github.com/tatru/TatruMedGemma.git
cd TatruMedGemma
```

### 2. Run the Expo app

```sh
cd TatruMedGemmaApp
npm install
npx expo start
```

Open the app in a development build, simulator, emulator, or Expo tooling
appropriate for your platform.

### 3. Choose an inference mode

- `On-device`: download a GGUF model from a URL you control and run the
  text-only device provider locally.
- `LAN`: point the app at your own Ollama or Flask server on your network.
- `Hosted`: point the app at your own OpenAI-compatible API or hosted
  Gradio endpoint.

### 4. Optional LAN / Flask setup

Ollama example:

```sh
ollama pull MedAIBase/MedGemma1.5:4b
```

Flask example:

```sh
cd MedGemmaFlaskAPI
conda activate medgemma2
python api_stable.py
```

Configure the corresponding URL in the app settings before use.

## Inference Modes And Data Flow

| Mode | Typical provider | Where prompts and images go |
| --- | --- | --- |
| On-device | `llama.rn` with GGUF files | Prompt text stays on the device during inference. Model downloads still come from the configured URL. The current device provider is text-only. |
| LAN | Ollama, Flask, optional MedSigLIP | Prompts and any attached images are sent to the user-configured LAN server(s). Logs, retention, and security depend on your server and network setup. |
| Hosted / online | OpenAI-compatible API, Gradio / Kaggle endpoint | Prompts and images may leave the device and pass through third-party infrastructure. Review provider terms, logs, telemetry, and retention before use. |

The repository does not include a backend conversation store. However, the
current app does persist chat history, endpoint settings, and model
configuration locally on the device. External providers and servers may log
or retain data independently of this repo. See [PRIVACY.md](PRIVACY.md).

## Responsible Use

- Do not use this project for diagnosis, treatment, prescribing,
  medication dosing, emergency care, or clinical decision-making.
- Do not use it as an unsupervised patient-facing system.
- Do not present image outputs as clinically reliable interpretations.
- Do not use real patient data in public demos, sample issues, screenshots,
  or pull requests.
- Do not upload identifiable medical images unless you have legal authority,
  patient consent where required, and appropriate security safeguards.
- Do not claim accuracy, clinical validation, regulatory approval,
  HIPAA/GDPR compliance, or fitness for healthcare deployment.

## Model And License Responsibility

This repository currently references or demonstrates the following upstream
artifacts and endpoints:

- Hugging Face GGUF downloads:
  `https://huggingface.co/unsloth/medgemma-4b-it-GGUF`
- Hugging Face / Transformers model ID:
  `google/medgemma-1.5-4b-it`
- Ollama model example:
  `MedAIBase/MedGemma1.5:4b`
- Guardrails manifest example:
  `TatruMedGemmaApp/guardrails/manifest.example.json`
- Hosted Gradio / Kaggle endpoints:
  user supplied in app settings
- Hosted OpenAI-compatible endpoints:
  user supplied in app settings
- Optional MedSigLIP / MedASR endpoints:
  user supplied in app settings

The repository license does not grant rights to Google Gemma / MedGemma
weights, tokenizer files, Hugging Face-hosted artifacts, Ollama-served
models, Gradio-hosted demos, or any third-party API. Those remain subject
to their own licenses, acceptable-use policies, access terms, and model
cards. If you want a local model directory such as
`MedGemmaFlaskAPI/quant-medgemma/`, populate it yourself from upstream
sources you are allowed to use.

## Additional Documentation

- [Safety](docs/SAFETY.md)
- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Third-Party Notices](THIRD-PARTY-NOTICES.md)
- [Open Source Status](docs/OPEN-SOURCE-STATUS.md)
- [Offline Notes](OFFLINE.md)
- [Conda Setup](CONDA_SETUP.md)
