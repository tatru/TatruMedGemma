import { Platform } from 'react-native';

const DEFAULT_LAN_OLLAMA_URL = 'http://127.0.0.1:11434';

export type InferenceMode = 'device' | 'lan' | 'cloud' | 'flask' | 'kaggle';

const getLocalhost = () => {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (Platform.OS === 'android') {
    return DEFAULT_LAN_OLLAMA_URL;
  }

  if (Platform.OS === 'ios') {
    return DEFAULT_LAN_OLLAMA_URL;
  }

  return 'http://localhost:11434';
};

export const OLLAMA_BASE_URL = getLocalhost();
export const GEMMA_MODEL = process.env.EXPO_PUBLIC_OLLAMA_MODEL?.trim() || 'MedAIBase/MedGemma1.5:4b';
export const DEVICE_GGUF_URL =
  process.env.EXPO_PUBLIC_DEVICE_GGUF_URL?.trim() ||
  'https://huggingface.co/unsloth/medgemma-4b-it-GGUF/resolve/main/medgemma-4b-it-Q4_K_S.gguf';
export const DEVICE_MMPROJ_URL =
  process.env.EXPO_PUBLIC_DEVICE_MMPROJ_URL?.trim() ||
  'https://huggingface.co/unsloth/medgemma-4b-it-GGUF/resolve/main/mmproj-F16.gguf';
export const OLLAMA_SYSTEM_PROMPT =
  process.env.EXPO_PUBLIC_OLLAMA_SYSTEM_PROMPT?.trim() ||
  'You are an experimental medical information assistant prototype powered by MedGemma. Provide general educational information, state uncertainty clearly, avoid diagnosis, treatment, prescribing, or emergency triage instructions, and direct users to qualified medical professionals for review.';

const resolveDefaultInferenceMode = (): InferenceMode => {
  const configured = process.env.EXPO_PUBLIC_INFERENCE_MODE?.trim().toLowerCase();
  if (
    configured === 'device' ||
    configured === 'lan' ||
    configured === 'cloud' ||
    configured === 'flask' ||
    configured === 'kaggle'
  ) {
    return configured;
  }
  return 'lan';
};

export const DEFAULT_INFERENCE_MODE = resolveDefaultInferenceMode();

export const CLOUD_BASE_URL =
  process.env.EXPO_PUBLIC_CLOUD_BASE_URL?.trim() || '';
export const CLOUD_MODEL = process.env.EXPO_PUBLIC_CLOUD_MODEL?.trim() || '';
export const CLOUD_API_KEY = process.env.EXPO_PUBLIC_CLOUD_API_KEY?.trim() || '';
export const CLOUD_SYSTEM_PROMPT =
  process.env.EXPO_PUBLIC_CLOUD_SYSTEM_PROMPT?.trim() || OLLAMA_SYSTEM_PROMPT;

export const GUARDRAILS_MANIFEST_URL =
  process.env.EXPO_PUBLIC_GUARDRAILS_MANIFEST_URL?.trim() ||
  'https://raw.githubusercontent.com/asierraserna/TatruMedGemma/refs/heads/main/TatruMedGemmaApp/guardrails/manifest.example.json';

// Kaggle Spaces Gradio endpoint, e.g. https://abc123.gradio.live
export const KAGGLE_GRADIO_URL =
  process.env.EXPO_PUBLIC_KAGGLE_GRADIO_URL?.trim() || '';

// Tuned defaults used by the device provider when the user hasn't overridden them.
export const DEVICE_N_CTX = 768;
export const DEVICE_N_PREDICT = 384;

// Warn users if their device has very little physical RAM – on‑device inference
// is unlikely to succeed on phones with less than the configured threshold.
// default is currently 6 GB but can be reduced for testing.
export const DEVICE_MIN_TOTAL_MEMORY_BYTES = 6 * 1024 * 1024 * 1024; // 6 GB
