import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  NativeModules,
} from 'react-native';
import { Stack } from 'expo-router';
import { InferenceMode, DEVICE_MIN_TOTAL_MEMORY_BYTES } from '../../constants/Config';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { planGuardrailsUpdate } from '../../services/guardrails/updateService';
import { checkOllamaConnection, fetchOllamaModelTags } from '../../services/ollamaService';
import { useInferenceStore } from '../../store/inferenceStore';

const modeOptions: { mode: InferenceMode; label: string }[] = [
  { mode: 'device', label: 'On-device' },
  { mode: 'lan', label: 'LAN' },
  { mode: 'cloud', label: 'Cloud' },
  { mode: 'flask', label: 'Flask API' },
  { mode: 'kaggle', label: 'Kaggle Space' },
];

// export options to configure the tab appearance
export const options = {
  title: 'Settings',
  tabBarIcon: ({ color }: { color: string }) => (
    <IconSymbol size={28} name="gearshape.fill" color={color} />
  ),
};

export default function SettingsScreen() {
  const mode = useInferenceStore((state) => state.mode);
  const device = useInferenceStore((state) => state.device);
  const lan = useInferenceStore((state) => state.lan);
  const cloud = useInferenceStore((state) => state.cloud);
  const flask = useInferenceStore((state) => state.flask);
  const kaggle = useInferenceStore((state) => state.kaggle);
  const medsiglip = useInferenceStore((state) => state.medsiglip);
  const medasr = useInferenceStore((state) => state.medasr);
  const guardrails = useInferenceStore((state) => state.guardrails);
  const actions = useInferenceStore((state) => state.actions);

  const [draftMode, setDraftMode] = useState<InferenceMode>(mode);
  const [deviceModelId, setDeviceModelId] = useState(device.modelId || '');
  const [deviceGgufUrl, setDeviceGgufUrl] = useState(device.ggufUrl || '');
  const [deviceMmprojUrl, setDeviceMmprojUrl] = useState(device.mmprojUrl || '');
  const [deviceNCtx, setDeviceNCtx] = useState(device.nCtx?.toString() || '');
  const [deviceNBatch, setDeviceNBatch] = useState(device.nBatch?.toString() || '');
  const [deviceUseMlock, setDeviceUseMlock] = useState(device.useMlock || false);
  const [lanBaseUrl, setLanBaseUrl] = useState(lan.baseUrl || '');
  const [lanModel, setLanModel] = useState(lan.model || '');
  const [cloudBaseUrl, setCloudBaseUrl] = useState(cloud.baseUrl || '');
  const [cloudModel, setCloudModel] = useState(cloud.model || '');
  const [cloudApiKey, setCloudApiKey] = useState(cloud.apiKey || '');
  const [flaskBaseUrl, setFlaskBaseUrl] = useState(flask.baseUrl || '');
  const [kaggleGradioUrl, setKaggleGradioUrl] = useState(kaggle.gradioUrl || '');
  const [testingKaggleConnection, setTestingKaggleConnection] = useState(false);
  const [kaggleTestResult, setKaggleTestResult] = useState<string | null>(null);
  const [medsiglipEnabled, setMedsiglipEnabled] = useState(medsiglip.enabled);
  const [medsiglipBaseUrl, setMedsiglipBaseUrl] = useState(medsiglip.baseUrl || '');
  const [medsiglipModel, setMedsiglipModel] = useState(medsiglip.model || '');
  const [medsiglipAnalyzePath, setMedsiglipAnalyzePath] = useState(medsiglip.analyzePath || '');
  const [medasrEnabled, setMedasrEnabled] = useState(medasr.enabled);
  const [medasrBaseUrl, setMedasrBaseUrl] = useState(medasr.baseUrl || '');
  const [medasrModel, setMedasrModel] = useState(medasr.model || '');
  const [medasrTranscribePath, setMedasrTranscribePath] = useState(medasr.transcribePath || '');
  const [guardrailsManifestUrl, setGuardrailsManifestUrl] = useState(guardrails.manifestUrl || '');
  const [newTopicName, setNewTopicName] = useState('');
  const [deviceTotalMem, setDeviceTotalMem] = useState<number | null>(null);
  const [deviceTotalMemRaw, setDeviceTotalMemRaw] = useState<any>(null);
  const [showMemoryAlert, setShowMemoryAlert] = useState(false);
  const [newTopicAllowed, setNewTopicAllowed] = useState(true);
  const [promptVersion, setPromptVersion] = useState('');
  const [promptLabel, setPromptLabel] = useState('');
  const [promptChangeNote, setPromptChangeNote] = useState('');
  const [promptBody, setPromptBody] = useState('');
  const [testingLanConnection, setTestingLanConnection] = useState(false);
  const [testingFlaskConnection, setTestingFlaskConnection] = useState(false);
  const [activeSection, setActiveSection] = useState<'inference' | 'guardrails'>('inference');
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [lanTestResult, setLanTestResult] = useState<string | null>(null);
  const [flaskTestResult, setFlaskTestResult] = useState<string | null>(null);
  const [lanModels, setLanModels] = useState<string[]>([]);
  const [loadingLanModels, setLoadingLanModels] = useState(false);
  const [showLanModelPicker, setShowLanModelPicker] = useState(false);
  const [lanModelSearch, setLanModelSearch] = useState('');
  const [checkingGuardrailsUpdate, setCheckingGuardrailsUpdate] = useState(false);
  const [guardrailsCheckResult, setGuardrailsCheckResult] = useState<string | null>(null);
  const [promptSaveResult, setPromptSaveResult] = useState<string | null>(null);

  const guardrailsTopics = useMemo(() => guardrails.allowedTopics || [], [guardrails.allowedTopics]);

  // fetch total memory once on mount
  React.useEffect(() => {
    const pc = (NativeModules as any)?.PlatformConstants;
    const mem = pc?.totalMemory;
    setDeviceTotalMemRaw(mem);
    if (typeof mem === 'number') {
      setDeviceTotalMem(mem);
    }
  }, []);

  // show a one-time alert when user selects on-device mode on a low-RAM device
  React.useEffect(() => {
    if (
      draftMode === 'device' &&
      deviceTotalMem !== null &&
      deviceTotalMem < DEVICE_MIN_TOTAL_MEMORY_BYTES &&
      !showMemoryAlert
    ) {
      const gb = (deviceTotalMem / (1024 ** 3)).toFixed(1);
      Alert.alert(
        'Low device memory',
        `This phone only has about ${gb} GB of RAM; on-device inference may fail or be very slow. ` +
          'Consider using LAN or cloud mode instead.',
        [{ text: 'OK', onPress: () => setShowMemoryAlert(true) }]
      );
    }
  }, [draftMode, deviceTotalMem, showMemoryAlert]);

  // warn when selecting on-device on web builds since it can't actually run
  React.useEffect(() => {
    if (draftMode === 'device' && Platform.OS === 'web') {
      Alert.alert(
        'Not supported on web',
        'On-device inference is disabled in the web version of the app. Use a LAN or hosted endpoint instead.',
        [{ text: 'OK' }]
      );
    }
  }, [draftMode]);
  const guardrailsPromptTemplates = useMemo(
    () => guardrails.promptTemplates || [],
    [guardrails.promptTemplates]
  );

  const filteredLanModels = useMemo(() => {
    const query = lanModelSearch.trim().toLowerCase();
    if (!query) {
      return lanModels;
    }

    return lanModels.filter((modelName) => modelName.toLowerCase().includes(query));
  }, [lanModelSearch, lanModels]);

  const hasChanges = useMemo(() => {
    return (
      draftMode !== mode ||
      deviceModelId !== device.modelId ||
      deviceGgufUrl !== device.ggufUrl ||
      deviceMmprojUrl !== (device.mmprojUrl || '') ||
      deviceNCtx !== (device.nCtx?.toString() || '') ||
      deviceNBatch !== (device.nBatch?.toString() || '') ||
      deviceUseMlock !== !!device.useMlock ||
      lanBaseUrl !== lan.baseUrl ||
      lanModel !== lan.model ||
      cloudBaseUrl !== cloud.baseUrl ||
      cloudModel !== cloud.model ||
      cloudApiKey !== cloud.apiKey ||
      flaskBaseUrl !== flask.baseUrl ||
      kaggleGradioUrl !== kaggle.gradioUrl ||
      medsiglipEnabled !== medsiglip.enabled ||
      medsiglipBaseUrl !== medsiglip.baseUrl ||
      medsiglipModel !== medsiglip.model ||
      medsiglipAnalyzePath !== medsiglip.analyzePath ||
      medasrEnabled !== medasr.enabled ||
      medasrBaseUrl !== medasr.baseUrl ||
      medasrModel !== medasr.model ||
      medasrTranscribePath !== medasr.transcribePath ||
      guardrailsManifestUrl !== guardrails.manifestUrl
    );
  }, [
    guardrails.manifestUrl,
    guardrailsManifestUrl,
    medasr.enabled,
    medasr.model,
    medasr.baseUrl,
    medasr.transcribePath,
    medasrEnabled,
    medasrModel,
    medasrBaseUrl,
    medasrTranscribePath,
    device.ggufUrl,
    device.mmprojUrl,
    device.modelId,
    device.nCtx,
    device.nBatch,
    device.useMlock,
    deviceGgufUrl,
    deviceMmprojUrl,
    deviceModelId,
    deviceNCtx,
    deviceNBatch,
    deviceUseMlock,
    medsiglip.enabled,
    medsiglip.model,
    medsiglip.baseUrl,
    medsiglip.analyzePath,
    medsiglipEnabled,
    medsiglipModel,
    medsiglipBaseUrl,
    medsiglipAnalyzePath,
    cloud.apiKey,
    cloud.baseUrl,
    cloud.model,
    flask.baseUrl,
    kaggle.gradioUrl,
    cloudApiKey,
    cloudBaseUrl,
    cloudModel,
    flaskBaseUrl,
    kaggleGradioUrl,
    draftMode,
    lan.baseUrl,
    lan.model,
    lanBaseUrl,
    lanModel,
    mode,
  ]);

  const activePromptTemplate = useMemo(() => {
    return guardrailsPromptTemplates.find(
      (template) => template.id === guardrails.activePromptTemplateId
    );
  }, [guardrails.activePromptTemplateId, guardrailsPromptTemplates]);

  const togglePromptExpansion = (id: string) => {
    setExpandedPrompts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    // helper that never crashes when given undefined/null
    const safe = (v?: string) => (v || '').trim();

    if (draftMode === 'lan' && !safe(lanBaseUrl)) {
      Alert.alert('Validation', 'LAN Base URL cannot be empty.');
      return;
    }

    if (draftMode === 'flask' && !safe(flaskBaseUrl)) {
      Alert.alert('Validation', 'Flask Base URL cannot be empty.');
      return;
    }

    if (draftMode === 'kaggle' && !safe(kaggleGradioUrl)) {
      Alert.alert('Validation', 'Kaggle Space Gradio URL cannot be empty.');
      return;
    }

    actions.setMode(draftMode);
    actions.updateDevice({
      modelId: safe(deviceModelId),
      ggufUrl: safe(deviceGgufUrl),
      mmprojUrl: safe(deviceMmprojUrl) || undefined,
      nCtx: safe(deviceNCtx) ? parseInt(safe(deviceNCtx), 10) : undefined,
      nBatch: safe(deviceNBatch) ? parseInt(safe(deviceNBatch), 10) : undefined,
      useMlock: deviceUseMlock,
    });
    actions.updateLan({
      baseUrl: safe(lanBaseUrl),
      model: safe(lanModel),
    });
    actions.updateCloud({
      baseUrl: safe(cloudBaseUrl),
      model: safe(cloudModel),
      apiKey: safe(cloudApiKey),
    });
    actions.updateFlask({
      baseUrl: safe(flaskBaseUrl),
    });
    actions.updateKaggle({
      gradioUrl: safe(kaggleGradioUrl),
    });
    actions.updateMedsiglip({
      enabled: medsiglipEnabled,
      baseUrl: safe(medsiglipBaseUrl),
      model: safe(medsiglipModel),
      analyzePath: safe(medsiglipAnalyzePath),
    });
    actions.updateMedasr({
      enabled: medasrEnabled,
      baseUrl: safe(medasrBaseUrl),
      model: safe(medasrModel),
      transcribePath: safe(medasrTranscribePath),
    });
    actions.updateGuardrails({
      manifestUrl: safe(guardrailsManifestUrl),
    });

    Alert.alert('Saved', 'Inference settings updated.');
  };

  const handleCheckGuardrailsUpdates = async () => {
    const manifestUrl = guardrailsManifestUrl.trim();
    if (!manifestUrl) {
      Alert.alert('Validation', 'Guardrails manifest URL cannot be empty.');
      return;
    }

    setCheckingGuardrailsUpdate(true);
    setGuardrailsCheckResult('Checking...');

    try {
      const plan = await planGuardrailsUpdate(manifestUrl);
      const bundleCount = plan.requiredBundles.length;
      const resultText = `v${plan.manifest.dbVersion} · ${bundleCount} required bundle${bundleCount === 1 ? '' : 's'}`;
      setGuardrailsCheckResult(resultText);

      // if the manifest includes guardrails metadata, merge it into store
      if (plan.guardrailsPatch && Object.keys(plan.guardrailsPatch).length > 0) {
        actions.updateGuardrails(plan.guardrailsPatch);
        Alert.alert(
          'Guardrails updated',
          `Version: ${plan.manifest.dbVersion}\nRules and prompts from manifest have been applied.`
        );
      } else {
        Alert.alert(
          'Guardrails update available',
          `Version: ${plan.manifest.dbVersion}\nRequired bundles: ${bundleCount}`
        );
      }
    } catch (error) {
      const message = (error as Error).message || 'Failed to check guardrails updates.';
      setGuardrailsCheckResult('Check failed');
      Alert.alert('Guardrails update check failed', message);
    } finally {
      setCheckingGuardrailsUpdate(false);
    }
  };

  const handleTestLanConnection = async () => {
    const baseUrl = lanBaseUrl.trim();
    if (!baseUrl) {
      Alert.alert('Validation', 'LAN Base URL cannot be empty.');
      return;
    }

    setTestingLanConnection(true);
    setLanTestResult('Testing...');

    try {
      const connected = await checkOllamaConnection(4000, { baseUrl });
      if (connected) {
        setLanTestResult('Connected');
        Alert.alert('Connection successful', `Ollama is reachable at ${baseUrl}`);
      } else {
        setLanTestResult('Offline');
        Alert.alert('Connection failed', `Could not reach Ollama at ${baseUrl}`);
      }
    } catch {
      setLanTestResult('Offline');
      Alert.alert('Connection failed', `Could not reach Ollama at ${baseUrl}`);
    } finally {
      setTestingLanConnection(false);
    }
  };

  const handleTestFlaskConnection = async () => {
    const baseUrl = flaskBaseUrl.trim();
    if (!baseUrl) {
      Alert.alert('Validation', 'Flask Base URL cannot be empty.');
      return;
    }

    setTestingFlaskConnection(true);
    setFlaskTestResult('Testing...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (response.ok) {
        setFlaskTestResult('Connected');
        Alert.alert('Connection successful', `Flask API is reachable at ${baseUrl}`);
      } else {
        setFlaskTestResult('Offline');
        Alert.alert('Connection failed', `Flask API responded with ${response.status} at ${baseUrl}`);
      }
    } catch {
      setFlaskTestResult('Offline');
      Alert.alert('Connection failed', `Could not reach Flask API at ${baseUrl}`);
    } finally {
      clearTimeout(timeout);
      setTestingFlaskConnection(false);
    }
  };

  const handleTestKaggleConnection = async () => {
    const gradioUrl = kaggleGradioUrl.trim().replace(/\/$/, '');
    if (!gradioUrl) {
      Alert.alert('Validation', 'Kaggle Space Gradio URL cannot be empty.');
      return;
    }

    setTestingKaggleConnection(true);
    setKaggleTestResult('Testing...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      // Gradio 5.x: /gradio_api/info is the canonical health endpoint
      const healthPaths = ['/gradio_api/info', '/config'];
      let reachable = false;

      for (const path of healthPaths) {
        try {
          const response = await fetch(`${gradioUrl}${path}`, {
            method: 'GET',
            signal: controller.signal,
          });

          if (response.status < 500) {
            reachable = true;
            break;
          }
        } catch {
          // Try next path.
        }
      }

      if (reachable) {
        setKaggleTestResult('Connected');
        Alert.alert('Connection successful', `Kaggle Space is reachable at ${gradioUrl}`);
      } else {
        setKaggleTestResult('Offline');
        Alert.alert('Connection failed', 'Could not reach Gradio Space. Verify the URL and that the Space is public.');
      }
    } catch {
      setKaggleTestResult('Offline');
      Alert.alert('Connection failed', `Could not reach Kaggle Space at ${gradioUrl}`);
    } finally {
      clearTimeout(timeout);
      setTestingKaggleConnection(false);
    }
  };

  const handleLoadLanModels = async () => {
    const baseUrl = lanBaseUrl.trim();
    if (!baseUrl) {
      Alert.alert('Validation', 'LAN Base URL cannot be empty.');
      return;
    }

    setLoadingLanModels(true);
    try {
      const models = await fetchOllamaModelTags(5000, { baseUrl });
      setLanModels(models);
      setShowLanModelPicker(true);
      setLanModelSearch('');

      if (models.length === 0) {
        Alert.alert('No models found', 'Ollama is reachable but no models are currently installed.');
      }
    } catch (error) {
      Alert.alert(
        'Failed to load models',
        (error as Error).message || 'Could not fetch model tags from Ollama.'
      );
    } finally {
      setLoadingLanModels(false);
    }
  };

  const handleAddTopic = () => {
    const topicName = newTopicName.trim();
    if (!topicName) {
      Alert.alert('Validation', 'Topic name cannot be empty.');
      return;
    }

    actions.upsertGuardrailsTopic({
      id: '',
      topicName,
      isAllowed: newTopicAllowed,
      enabled: true,
    });
    setNewTopicName('');
  };

  const handleSavePromptVersion = () => {
    if (!promptVersion.trim() || !promptLabel.trim() || !promptBody.trim()) {
      setPromptSaveResult('Missing required fields');
      Alert.alert('Validation', 'Version, label, and prompt body are required.');
      return;
    }

    actions.savePromptTemplateVersion({
      version: promptVersion.trim(),
      label: promptLabel.trim(),
      prompt: promptBody.trim(),
      changeNote: promptChangeNote.trim() || undefined,
    });

    setPromptVersion('');
    setPromptLabel('');
    setPromptChangeNote('');
    setPromptBody('');
    setPromptSaveResult('Prompt version saved');
    Alert.alert('Saved', 'Prompt template version created and activated.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Inference Settings' }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* section selector */}
        <View style={styles.sectionMenu}>
          <TouchableOpacity
            style={[
              styles.sectionMenuButton,
              activeSection === 'inference' && styles.sectionMenuButtonActive,
            ]}
            onPress={() => setActiveSection('inference')}
          >
            <Text
              style={[
                styles.sectionMenuText,
                activeSection === 'inference' && styles.sectionMenuTextActive,
              ]}
            >
              Inference
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sectionMenuButton,
              activeSection === 'guardrails' && styles.sectionMenuButtonActive,
            ]}
            onPress={() => setActiveSection('guardrails')}
          >
            <Text
              style={[
                styles.sectionMenuText,
                activeSection === 'guardrails' && styles.sectionMenuTextActive,
              ]}
            >
              Guardrails
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'inference' && (
          <>
            <Text style={styles.sectionTitle}>Mode</Text>
            <View style={styles.modeRow}>
              {modeOptions.map((option) => {
                const selected = draftMode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[styles.modeChip, selected && styles.modeChipActive]}
                    onPress={() => {
                      setDraftMode(option.mode);
                      actions.setMode(option.mode);
                    }}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        selected && styles.modeChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>
              Mode controls where prompts and images go. On-device keeps inference local, LAN sends data to your own server, and hosted modes send data to configured third-party infrastructure.
            </Text>

            {/* LAN, Cloud, MedSigLIP, MedASR settings */}
            <Text style={styles.sectionTitle}>On-device (GGUF)</Text>
            <Text style={styles.fieldLabel}>Model ID</Text>
            <TextInput
              style={styles.input}
              value={deviceModelId}
              onChangeText={setDeviceModelId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="google/medgemma-4b-it"
            />
            {deviceTotalMem !== null && (
              <>
                <Text style={styles.helperText}>
                  Device RAM: {(deviceTotalMem / (1024 ** 3)).toFixed(1)} GB
                </Text>
                {deviceTotalMemRaw != null && (
                  <Text style={styles.helperText}>
                    (raw: {String(deviceTotalMemRaw)})
                  </Text>
                )}
              </>
            )}
            {deviceTotalMem !== null && deviceTotalMem < DEVICE_MIN_TOTAL_MEMORY_BYTES && (
              <Text style={[styles.helperText, { color: '#d00' }]}>Low memory: on-device inference may not work. Consider LAN or hosted modes.</Text>
            )}
            <Text style={styles.fieldLabel}>GGUF Download URL</Text>
            <TextInput
              style={styles.input}
              value={deviceGgufUrl}
              onChangeText={setDeviceGgufUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://huggingface.co/.../medgemma-4b-it-Q4_K_S.gguf"
            />
            <Text style={styles.fieldLabel}>mmproj URL (optional for vision)</Text>
            <TextInput
              style={styles.input}
              value={deviceMmprojUrl}
              onChangeText={setDeviceMmprojUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://huggingface.co/.../mmproj-F16.gguf"
            />
            <Text style={styles.fieldLabel}>Context window (n_ctx)</Text>
            <TextInput
              style={styles.input}
              value={deviceNCtx}
              onChangeText={setDeviceNCtx}
              keyboardType="numeric"
              placeholder="768"
            />
            <Text style={styles.fieldLabel}>Batch size (n_batch)</Text>
            <TextInput
              style={styles.input}
              value={deviceNBatch}
              onChangeText={setDeviceNBatch}
              keyboardType="numeric"
              placeholder="64"
            />
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Use mlock</Text>
              <Switch
                value={deviceUseMlock}
                onValueChange={setDeviceUseMlock}
              />
            </View>
            <Text style={styles.helperText}>
              Public, direct URLs are easiest for mobile download. Downloaded model files stay on the device, but the model source and license remain upstream.
            </Text>

            <Text style={styles.sectionTitle}>LAN (Ollama)</Text>
            <Text style={styles.fieldLabel}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={lanBaseUrl}
              onChangeText={setLanBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.50.21:11434"
            />
            <Text style={styles.helperText}>
              Prompts and attached images are sent to the LAN server you configure here. Replace this example URL with your own reachable host or device IP.
            </Text>
            <Text style={styles.fieldLabel}>Model</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowLanModelPicker(true);
                setLanModelSearch('');
              }}
            >
              <Text style={styles.dropdownText}>{lanModel || 'Select a model'}</Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </TouchableOpacity>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, loadingLanModels && styles.secondaryButtonDisabled]}
                onPress={handleLoadLanModels}
                disabled={loadingLanModels}
              >
                {loadingLanModels ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Load from Ollama</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowLanModelPicker(true);
                  setLanModelSearch('');
                }}
              >
                <Text style={styles.secondaryButtonText}>Open Picker</Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showLanModelPicker}
              animationType="slide"
              transparent
              onRequestClose={() => setShowLanModelPicker(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Select LAN Model</Text>

                  <TextInput
                    style={styles.modalSearchInput}
                    value={lanModelSearch}
                    onChangeText={setLanModelSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Search model tags..."
                  />

                  {lanModels.length === 0 ? (
                    <Text style={styles.dropdownEmptyText}>No loaded tags yet. Tap Load from Ollama.</Text>
                  ) : (
                    <FlatList
                      data={filteredLanModels}
                      keyExtractor={(item) => item}
                      style={styles.modalList}
                      contentContainerStyle={styles.modalListContent}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => {
                        const selected = item === lanModel;
                        return (
                          <TouchableOpacity
                            style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                            onPress={() => {
                              setLanModel(item);
                              setShowLanModelPicker(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                      ListEmptyComponent={
                        <Text style={styles.dropdownEmptyText}>No model matches your search.</Text>
                      }
                    />
                  )}

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowLanModelPicker(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <TextInput
              style={styles.input}
              value={lanModel}
              onChangeText={setLanModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="MedAIBase/MedGemma1.5:4b"
            />
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[styles.testButton, testingLanConnection && styles.testButtonDisabled]}
                onPress={handleTestLanConnection}
                disabled={testingLanConnection}
              >
                <Text style={styles.testButtonText}>
                  {testingLanConnection ? 'Testing...' : 'Test Connection'}
                </Text>
              </TouchableOpacity>
              {!!lanTestResult && <Text style={styles.testResultText}>{lanTestResult}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Cloud</Text>
            <Text style={styles.fieldLabel}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={cloudBaseUrl}
              onChangeText={setCloudBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://your-openai-compatible-endpoint.example/v1"
            />
            <Text style={styles.fieldLabel}>Model</Text>
            <TextInput
              style={styles.input}
              value={cloudModel}
              onChangeText={setCloudModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="gpt-4.1-mini"
            />
            <Text style={styles.fieldLabel}>API Key</Text>
            <TextInput
              style={styles.input}
              value={cloudApiKey}
              onChangeText={setCloudApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="sk-..."
              secureTextEntry
            />
            <Text style={styles.helperText}>
              Hosted API mode sends prompts and optional images off-device. Review provider terms, logs, retention, and security before use.
            </Text>

            <Text style={styles.sectionTitle}>Flask API</Text>
            <Text style={styles.fieldLabel}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={flaskBaseUrl}
              onChangeText={setFlaskBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://127.0.0.1:5000"
            />
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[styles.testButton, testingFlaskConnection && styles.testButtonDisabled]}
                onPress={handleTestFlaskConnection}
                disabled={testingFlaskConnection}
              >
                <Text style={styles.testButtonText}>
                  {testingFlaskConnection ? 'Testing...' : 'Test Flask Connection'}
                </Text>
              </TouchableOpacity>
              {!!flaskTestResult && <Text style={styles.testResultText}>{flaskTestResult}</Text>}
            </View>
            <Text style={styles.helperText}>
              Flask mode sends prompts and optional images to the configured server. Do not expose a Flask endpoint on an untrusted network without your own protections.
            </Text>

            <Text style={styles.sectionTitle}>Hosted Gradio / Kaggle Space</Text>
            <Text style={styles.fieldLabel}>Gradio URL</Text>
            <TextInput
              style={styles.input}
              value={kaggleGradioUrl}
              onChangeText={setKaggleGradioUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://abc123.gradio.live"
            />
            <Text style={styles.helperText}>
              {'Prompts and optional images are sent to this hosted endpoint. Use a public Gradio URL you control, and review third-party retention and logging before use.'}
            </Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[styles.testButton, testingKaggleConnection && styles.testButtonDisabled]}
                onPress={handleTestKaggleConnection}
                disabled={testingKaggleConnection}
              >
                <Text style={styles.testButtonText}>
                  {testingKaggleConnection ? 'Testing...' : 'Test Kaggle Connection'}
                </Text>
              </TouchableOpacity>
              {!!kaggleTestResult && <Text style={styles.testResultText}>{kaggleTestResult}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Image Analyzer (MedSigLIP / MedGemma Flask)</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Enable Image Analyzer Routing</Text>
              <Switch value={medsiglipEnabled} onValueChange={setMedsiglipEnabled} />
            </View>
            <Text style={styles.helperText}>
              When enabled, the latest image and prompt are sent to this analyzer service. Treat the returned text as experimental and non-clinical.
            </Text>
            <Text style={styles.fieldLabel}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={medsiglipBaseUrl}
              onChangeText={setMedsiglipBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.50.21:5000"
            />
            <Text style={styles.fieldLabel}>Model (optional)</Text>
            <TextInput
              style={styles.input}
              value={medsiglipModel}
              onChangeText={setMedsiglipModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="google/medgemma-1.5-4b-it"
            />
            <Text style={styles.fieldLabel}>Analyze Path</Text>
            <TextInput
              style={styles.input}
              value={medsiglipAnalyzePath}
              onChangeText={setMedsiglipAnalyzePath}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="/analyze"
            />

            <Text style={styles.sectionTitle}>MedASR (Dictation)</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Enable MedASR Routing</Text>
              <Switch value={medasrEnabled} onValueChange={setMedasrEnabled} />
            </View>
            <Text style={styles.helperText}>
              MedASR settings are stored locally, but end-to-end runtime use in this prototype requires additional code review.
            </Text>
            <Text style={styles.fieldLabel}>Base URL</Text>
            <TextInput
              style={styles.input}
              value={medasrBaseUrl}
              onChangeText={setMedasrBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.50.21:9000"
            />
            <Text style={styles.fieldLabel}>Model</Text>
            <TextInput
              style={styles.input}
              value={medasrModel}
              onChangeText={setMedasrModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="google/medasr"
            />
            <Text style={styles.fieldLabel}>Transcribe Path</Text>
            <TextInput
              style={styles.input}
              value={medasrTranscribePath}
              onChangeText={setMedasrTranscribePath}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="/transcribe"
            />
          </>
        )}


        {activeSection === 'guardrails' && (
          <>
            <Text style={styles.sectionTitle}>Guardrails Updates</Text>
            <Text style={styles.fieldLabel}>Manifest URL</Text>
            <TextInput
              style={styles.input}
              value={guardrailsManifestUrl}
              onChangeText={setGuardrailsManifestUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://your-server.example.com/guardrails/manifest.json"
            />
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  checkingGuardrailsUpdate && styles.secondaryButtonDisabled,
                ]}
                onPress={handleCheckGuardrailsUpdates}
                disabled={checkingGuardrailsUpdate}
              >
                {checkingGuardrailsUpdate ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Check for updates</Text>
                )}
              </TouchableOpacity>
              {!!guardrailsCheckResult && (
                <Text style={styles.testResultText}>{guardrailsCheckResult}</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Guardrails Topic Policy</Text>
            <Text style={styles.fieldLabel}>
              Manage allowed and denied topics at runtime.
            </Text>

            <View style={styles.topicCreateRow}>
              <TextInput
                style={[styles.input, styles.topicNameInput]}
                value={newTopicName}
                onChangeText={setNewTopicName}
                autoCapitalize="sentences"
                autoCorrect={false}
                placeholder="e.g. Self-harm methods"
              />
              <TouchableOpacity
                style={[
                  styles.topicDecisionButton,
                  newTopicAllowed && styles.topicDecisionButtonActiveAllow,
                ]}
                onPress={() => setNewTopicAllowed(true)}
              >
                <Text style={styles.topicDecisionButtonText}>Allow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.topicDecisionButton,
                  !newTopicAllowed && styles.topicDecisionButtonActiveDeny,
                ]}
                onPress={() => setNewTopicAllowed(false)}
              >
                <Text style={styles.topicDecisionButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleAddTopic}>
              <Text style={styles.secondaryButtonText}>Add Topic Rule</Text>
            </TouchableOpacity>

            {guardrailsTopics.map((topic) => (
              <View key={topic.id} style={styles.topicCard}>
                <Text style={styles.topicName}>{topic.topicName}</Text>
                <Text style={styles.topicMeta}>
                  Updated: {new Date(topic.updatedAt).toLocaleString()}
                </Text>
                <View style={styles.inlineActions}>
                  <TouchableOpacity
                    style={[
                      styles.topicDecisionButton,
                      topic.isAllowed && styles.topicDecisionButtonActiveAllow,
                    ]}
                    onPress={() =>
                      actions.upsertGuardrailsTopic({
                        ...topic,
                        isAllowed: true,
                        updatedAt: Date.now(),
                      })
                    }
                  >
                    <Text style={styles.topicDecisionButtonText}>Allow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.topicDecisionButton,
                      !topic.isAllowed && styles.topicDecisionButtonActiveDeny,
                    ]}
                    onPress={() =>
                      actions.upsertGuardrailsTopic({
                        ...topic,
                        isAllowed: false,
                        updatedAt: Date.now(),
                      })
                    }
                  >
                    <Text style={styles.topicDecisionButtonText}>Deny</Text>
                  </TouchableOpacity>
                  <View style={styles.toggleInlineRow}>
                    <Text style={styles.fieldLabel}>Enabled</Text>
                    <Switch
                      value={topic.enabled}
                      onValueChange={(enabled) =>
                        actions.upsertGuardrailsTopic({
                          ...topic,
                          enabled,
                          updatedAt: Date.now(),
                        })
                      }
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => actions.removeGuardrailsTopic(topic.id)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Prompt Engineering</Text>
            <Text style={styles.fieldLabel}>
              Versioned, auditable system prompts used for LAN inference.
            </Text>

            {activePromptTemplate ? (
              <View style={styles.activePromptCard}>
                <TouchableOpacity onPress={() => togglePromptExpansion(activePromptTemplate.id)}>
                  <Text style={styles.activePromptTitle}>
                    Active: {activePromptTemplate.label}{' '}
                    {expandedPrompts[activePromptTemplate.id] ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.topicMeta}>
                  Version: {activePromptTemplate.version}
                </Text>
                {!!activePromptTemplate.changeNote && (
                  <Text style={styles.topicMeta}>
                    Note: {activePromptTemplate.changeNote}
                  </Text>
                )}
                {expandedPrompts[activePromptTemplate.id] && (
                  <View style={styles.promptBodyContainer}>
                    <Text style={styles.promptBody}>{activePromptTemplate.prompt}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {guardrailsPromptTemplates.map((template) => {
              const isActive = template.id === guardrails.activePromptTemplateId;
              const expanded = !!expandedPrompts[template.id];
              return (
                <View key={template.id} style={styles.promptCard}>
                  <TouchableOpacity onPress={() => togglePromptExpansion(template.id)}>
                    <Text style={styles.promptTitle}>
                      {template.label} {expanded ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.topicMeta}>Version: {template.version}</Text>
                  {!!template.changeNote && (
                    <Text style={styles.topicMeta}>{template.changeNote}</Text>
                  )}
                  {expanded && (
                    <View style={styles.promptBodyContainer}>
                      <Text style={styles.promptBody}>{template.prompt}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      isActive && styles.secondaryButtonDisabled,
                    ]}
                    onPress={() => actions.setActivePromptTemplate(template.id)}
                    disabled={isActive}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isActive ? 'Active' : 'Set Active'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* new prompt version inputs inside guardrails section */}
            <Text style={styles.fieldLabel}>New Prompt Version</Text>
            <TextInput
              style={styles.input}
              value={promptVersion}
              onChangeText={setPromptVersion}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="e.g. 1.4.0"
            />
            <TextInput
              style={styles.input}
              value={promptLabel}
              onChangeText={setPromptLabel}
              autoCapitalize="sentences"
              autoCorrect={false}
              placeholder="e.g. Safety prompt with stricter escalation guidance"
            />
            <TextInput
              style={styles.input}
              value={promptChangeNote}
              onChangeText={setPromptChangeNote}
              autoCapitalize="sentences"
              autoCorrect={false}
              placeholder="Change note for audit trail"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={promptBody}
              onChangeText={setPromptBody}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="System prompt text"
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSavePromptVersion}>
              <Text style={styles.secondaryButtonText}>Save Prompt Version</Text>
            </TouchableOpacity>
            {!!promptSaveResult && <Text style={styles.testResultText}>{promptSaveResult}</Text>}

          </>
        )}


        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
    marginTop: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeChip: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  modeChipActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  modeChipText: {
    color: '#111',
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#fff',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 110,
  },
  topicCreateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  topicNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginTop: 10,
  },
  topicName: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
    marginBottom: 4,
  },
  topicMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  topicDecisionButton: {
    borderRadius: 8,
    backgroundColor: '#5a5f66',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topicDecisionButtonActiveAllow: {
    backgroundColor: '#34c759',
  },
  topicDecisionButtonActiveDeny: {
    backgroundColor: '#ff3b30',
  },
  topicDecisionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeButton: {
    backgroundColor: '#8e8e93',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  activePromptCard: {
    backgroundColor: '#eaf3ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d2e6ff',
    padding: 10,
    marginBottom: 10,
  },
  activePromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b4ea2',
    marginBottom: 4,
  },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
    marginBottom: 4,
  },
  promptBodyContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  promptBody: {
    fontSize: 13,
    color: '#333',
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  dropdownTrigger: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 15,
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  dropdownChevron: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    maxHeight: 220,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    maxHeight: '78%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  modalSearchInput: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  modalList: {
    maxHeight: 360,
  },
  modalListContent: {
    paddingBottom: 6,
  },
  modalCloseButton: {
    backgroundColor: '#5a5f66',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 12,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#eaf3ff',
  },
  dropdownItemText: {
    color: '#111',
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    color: '#0055cc',
    fontWeight: '700',
  },
  dropdownEmptyText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#666',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#5a5f66',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  testButton: {
    backgroundColor: '#34c759',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  testButtonDisabled: {
    opacity: 0.7,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  testResultText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 18,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionMenu: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
    marginTop: 34,
  },
  sectionMenuButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  sectionMenuButtonActive: {
    backgroundColor: '#007AFF',
  },
  sectionMenuText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  sectionMenuTextActive: {
    color: '#fff',
  },
});
