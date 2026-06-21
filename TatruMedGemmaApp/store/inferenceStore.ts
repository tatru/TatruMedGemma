import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware.js';
import {
  CLOUD_API_KEY,
  CLOUD_BASE_URL,
  CLOUD_MODEL,
  CLOUD_SYSTEM_PROMPT,
  DEFAULT_INFERENCE_MODE,
  DEVICE_GGUF_URL,
  DEVICE_MMPROJ_URL,
  GEMMA_MODEL,
  GUARDRAILS_MANIFEST_URL,
  KAGGLE_GRADIO_URL,
  InferenceMode,
  OLLAMA_BASE_URL,
  OLLAMA_SYSTEM_PROMPT,
} from '../constants/Config';

export interface DeviceProviderSettings {
  modelId: string;
  ggufUrl: string;
  mmprojUrl?: string;
  modelPath?: string;
  // optional tuning controls for on-device inference
  nCtx?: number;
  nBatch?: number;
  useMlock?: boolean;
}

export interface LanProviderSettings {
  baseUrl: string;
  model: string;
  systemPrompt: string;
}

export interface CloudProviderSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
}

export interface FlaskProviderSettings {
  baseUrl: string;
}

export interface KaggleProviderSettings {
  /** Full Gradio Space URL, e.g. https://abc123.gradio.live */
  gradioUrl: string;
}

export interface MedSiglipSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  analyzePath: string;
}

export interface MedAsrSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  transcribePath: string;
}

export interface GuardrailsSettings {
  manifestUrl: string;
  allowedTopics: GuardrailsTopicPolicy[];
  promptTemplates: GuardrailsPromptTemplate[];
  activePromptTemplateId: string;

  // raw policy/prompt pack from manifest, mostly for transparency
  policy?: GuardrailsPolicy;
  promptPackInline?: PromptPackInline;
}

export interface GuardrailsPolicyRule {
  id: string;
  description: string;
  matchTopics: string[];
  decision: string;
  exampleResponse?: string;
}

export interface GuardrailsPolicy {
  version: string;
  defaultDecision: string;
  rules: GuardrailsPolicyRule[];
}

export interface PromptPackInline {
  templateKey: string;
  systemPrompt: string;
  userPromptExamples: UserPromptExample[];
}

export interface UserPromptExample {
  id: string;
  user: string;
  assistant: string;
}

export interface GuardrailsTopicPolicy {
  id: string;
  topicName: string;
  isAllowed: boolean;
  enabled: boolean;
  updatedAt: number;
}

export interface GuardrailsPromptTemplate {
  id: string;
  version: string;
  label: string;
  prompt: string;
  changeNote?: string;
  createdAt: number;
}

const createTopicId = () => `topic-${Math.random().toString(36).slice(2, 10)}`;
const createPromptId = () => `prompt-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_GUARDRAIL_TOPICS: GuardrailsTopicPolicy[] = [
  {
    id: 'topic-triage',
    topicName: 'Symptom discussion and escalation',
    isAllowed: true,
    enabled: true,
    updatedAt: Date.now(),
  },
  {
    id: 'topic-medication-safety',
    topicName: 'Medication information and contraindication discussion',
    isAllowed: true,
    enabled: true,
    updatedAt: Date.now(),
  },
  {
    id: 'topic-definitive-diagnosis',
    topicName: 'Definitive diagnosis or clinical claims',
    isAllowed: false,
    enabled: true,
    updatedAt: Date.now(),
  },
  {
    id: 'topic-prescription-dosing',
    topicName: 'Prescription dosing instructions',
    isAllowed: false,
    enabled: true,
    updatedAt: Date.now(),
  },
];

const DEFAULT_PROMPT_TEMPLATE: GuardrailsPromptTemplate = {
  id: 'prompt-default-v1',
  version: '1.0.0',
  label: 'Baseline safety prompt',
  prompt: OLLAMA_SYSTEM_PROMPT,
  changeNote: 'Initial baseline template',
  createdAt: Date.now(),
};

const normalizeGuardrailsSettings = (
  value?: Partial<GuardrailsSettings> | null
): GuardrailsSettings => {
  const promptTemplates = Array.isArray(value?.promptTemplates)
    ? value!.promptTemplates!.filter(Boolean)
    : [DEFAULT_PROMPT_TEMPLATE];

  const activePromptTemplateId =
    value?.activePromptTemplateId && promptTemplates.some((item) => item.id === value.activePromptTemplateId)
      ? value.activePromptTemplateId
      : promptTemplates[0]?.id || DEFAULT_PROMPT_TEMPLATE.id;

  return {
    manifestUrl: value?.manifestUrl || GUARDRAILS_MANIFEST_URL,
    allowedTopics: Array.isArray(value?.allowedTopics)
      ? value!.allowedTopics!.filter(Boolean)
      : DEFAULT_GUARDRAIL_TOPICS,
    promptTemplates,
    activePromptTemplateId,
    policy: value?.policy,
    promptPackInline: value?.promptPackInline,
  };
};

interface InferenceState {
  mode: InferenceMode;
  device: DeviceProviderSettings;
  lan: LanProviderSettings;
  cloud: CloudProviderSettings;
  flask: FlaskProviderSettings;
  kaggle: KaggleProviderSettings;
  medsiglip: MedSiglipSettings;
  medasr: MedAsrSettings;
  guardrails: GuardrailsSettings;
  actions: {
    setMode: (mode: InferenceMode) => void;
    updateDevice: (patch: Partial<DeviceProviderSettings>) => void;
    updateLan: (patch: Partial<LanProviderSettings>) => void;
    updateCloud: (patch: Partial<CloudProviderSettings>) => void;
    updateFlask: (patch: Partial<FlaskProviderSettings>) => void;
    updateKaggle: (patch: Partial<KaggleProviderSettings>) => void;
    updateMedsiglip: (patch: Partial<MedSiglipSettings>) => void;
    updateMedasr: (patch: Partial<MedAsrSettings>) => void;
    updateGuardrails: (patch: Partial<GuardrailsSettings>) => void;
    upsertGuardrailsTopic: (
      topic: Omit<GuardrailsTopicPolicy, 'updatedAt'> & { updatedAt?: number }
    ) => void;
    removeGuardrailsTopic: (topicId: string) => void;
    savePromptTemplateVersion: (input: {
      version: string;
      label: string;
      prompt: string;
      changeNote?: string;
    }) => void;
    setActivePromptTemplate: (templateId: string) => void;
  };
}

export const useInferenceStore = create<InferenceState>()(
  persist(
    (set) => ({
      mode: DEFAULT_INFERENCE_MODE,
      device: {
        modelId: GEMMA_MODEL,
        ggufUrl: DEVICE_GGUF_URL,
        mmprojUrl: DEVICE_MMPROJ_URL,
        nCtx: undefined,       // will default in provider
        nBatch: undefined,
        useMlock: undefined,
      },
      lan: {
        baseUrl: OLLAMA_BASE_URL,
        model: GEMMA_MODEL,
        systemPrompt: OLLAMA_SYSTEM_PROMPT,
      },
      cloud: {
        baseUrl: CLOUD_BASE_URL,
        model: CLOUD_MODEL,
        apiKey: CLOUD_API_KEY,
        systemPrompt: CLOUD_SYSTEM_PROMPT,
      },
      flask: {
        baseUrl: 'http://127.0.0.1:5000',
      },
      kaggle: {
        gradioUrl: KAGGLE_GRADIO_URL,
      },
      medsiglip: {
        enabled: false,
        baseUrl: '',
        model: 'google/medsiglip-448',
        analyzePath: '/analyze',
      },
      medasr: {
        enabled: false,
        baseUrl: '',
        model: 'google/medasr',
        transcribePath: '/transcribe',
      },
      guardrails: {
        manifestUrl: GUARDRAILS_MANIFEST_URL,
        allowedTopics: DEFAULT_GUARDRAIL_TOPICS,
        promptTemplates: [DEFAULT_PROMPT_TEMPLATE],
        activePromptTemplateId: DEFAULT_PROMPT_TEMPLATE.id,
      },
      actions: {
        setMode: (mode) => set({ mode }),
        updateDevice: (patch) =>
          set((state) => ({
            device: { ...state.device, ...patch },
          })),
        updateLan: (patch) =>
          set((state) => ({
            lan: { ...state.lan, ...patch },
          })),
        updateCloud: (patch) =>
          set((state) => ({
            cloud: { ...state.cloud, ...patch },
          })),
        updateFlask: (patch) =>
          set((state) => ({
            flask: { ...state.flask, ...patch },
          })),
        updateKaggle: (patch) =>
          set((state) => ({
            kaggle: { ...state.kaggle, ...patch },
          })),
        updateMedsiglip: (patch) =>
          set((state) => ({
            medsiglip: { ...state.medsiglip, ...patch },
          })),
        updateMedasr: (patch) =>
          set((state) => ({
            medasr: { ...state.medasr, ...patch },
          })),
        updateGuardrails: (patch) =>
          set((state) => ({
            guardrails: normalizeGuardrailsSettings({ ...state.guardrails, ...patch }),
          })),
        upsertGuardrailsTopic: (topic) =>
          set((state) => {
            const existingTopics = state.guardrails.allowedTopics || [];
            const existingIndex = existingTopics.findIndex(
              (entry) => entry.id === topic.id
            );

            const normalizedTopic: GuardrailsTopicPolicy = {
              id: topic.id || createTopicId(),
              topicName: topic.topicName,
              isAllowed: topic.isAllowed,
              enabled: topic.enabled,
              updatedAt: topic.updatedAt || Date.now(),
            };

            if (existingIndex === -1) {
              return {
                guardrails: {
                  ...state.guardrails,
                  allowedTopics: [...existingTopics, normalizedTopic],
                },
              };
            }

            const nextTopics = [...existingTopics];
            nextTopics[existingIndex] = normalizedTopic;

            return {
              guardrails: {
                ...state.guardrails,
                allowedTopics: nextTopics,
              },
            };
          }),
        removeGuardrailsTopic: (topicId) =>
          set((state) => ({
            guardrails: {
              ...state.guardrails,
              allowedTopics: (state.guardrails.allowedTopics || []).filter((topic) => topic.id !== topicId),
            },
          })),
        savePromptTemplateVersion: (input) =>
          set((state) => {
            const existingTemplates = state.guardrails.promptTemplates || [];
            const template: GuardrailsPromptTemplate = {
              id: createPromptId(),
              version: input.version,
              label: input.label,
              prompt: input.prompt,
              changeNote: input.changeNote,
              createdAt: Date.now(),
            };

            return {
              guardrails: {
                ...state.guardrails,
                promptTemplates: [template, ...existingTemplates],
                activePromptTemplateId: template.id,
              },
            };
          }),
        setActivePromptTemplate: (templateId) =>
          set((state) => {
            const exists = (state.guardrails.promptTemplates || []).some(
              (template) => template.id === templateId
            );
            if (!exists) {
              return state;
            }

            return {
              guardrails: {
                ...state.guardrails,
                activePromptTemplateId: templateId,
              },
            };
          }),
      },
    }),
    {
      name: 'inference-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<InferenceState>) || {};

        return {
          ...currentState,
          ...persisted,
          guardrails: normalizeGuardrailsSettings(
            (persisted.guardrails as Partial<GuardrailsSettings> | undefined) ||
              (currentState as InferenceState).guardrails
          ),
          actions: (currentState as InferenceState).actions,
        };
      },
      partialize: (state) => ({
        mode: state.mode,
        device: state.device,
        lan: state.lan,
        cloud: state.cloud,
        flask: state.flask,
        kaggle: state.kaggle,
        medsiglip: state.medsiglip,
        medasr: state.medasr,
        guardrails: state.guardrails,
      }),
    }
  )
);

export const getActiveGuardrailsPrompt = () => {
  const state = useInferenceStore.getState();
  const templates = state.guardrails.promptTemplates || [];
  const activeTemplate = templates.find(
    (template) => template.id === state.guardrails.activePromptTemplateId
  );

  return activeTemplate?.prompt?.trim() || '';
};
