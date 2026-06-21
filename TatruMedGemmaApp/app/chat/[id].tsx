import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useChatStore } from '../../store/chatStore';
import MessageItem from '../../components/MessageItem';
import { InputArea } from '../../components/InputArea';
import { generateResponseForActiveMode } from '../../services/inference/router';
import { analyzeImageWithMedsiglip } from '../../services/medsiglipService';
import { Message } from '../../types';
import { useInferenceStore } from '../../store/inferenceStore';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, actions } = useChatStore();
  
  const currentSession = sessions.find(s => s.id === id);
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // offset currently used to pad list; input positioning handled by KeyboardAvoidingView
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const inferenceMode = useInferenceStore((state) => state.mode);
  const flaskBaseUrl = useInferenceStore((state) => state.flask.baseUrl);
  const kaggleGradioUrl = useInferenceStore((state) => state.kaggle.gradioUrl);

  const normalizePickedImageUri = (asset: ImagePicker.ImagePickerAsset) => {
    if (Platform.OS === 'web' && asset.base64) {
      const mediaType = asset.mimeType || 'image/jpeg';
      return `data:${mediaType};base64,${asset.base64}`;
    }

    return asset.uri;
  };

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);


  // If session not found, handle it (redirect or create?)
  // For now, assume id is valid or redirect
  if (!currentSession) {
    // Should navigate back or show error
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const displayedMessages = streamingResponse
    ? [
        ...currentSession.messages,
        {
          id: 'streaming-assistant',
          role: 'assistant',
          content: streamingResponse,
          timestamp: Date.now(),
        } as Message,
      ]
    : currentSession.messages;

  const handleSend = async (text: string, imageUri?: string) => {
    if (!id || sendingRef.current) return;

    sendingRef.current = true;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStreamingResponse('');

    const persistedImageUri = imageUri?.startsWith('data:') ? undefined : imageUri;
    
    // 1. Add user message
    actions.addMessage(id, 'user', text, persistedImageUri);
    
    // Optimistic update for UI, but need robust context for AI
    setLoading(true);

    try {
      // Create message object to send to AI (including history + new message)
      const userMessage: Message = { 
        id: 'temp-user', // specific ID doesn't matter for context
        role: 'user', 
        content: text, 
        timestamp: Date.now(),
        imageUri,
      };
      
      const contextMessages = [...(currentSession?.messages || []), userMessage];

      // 3. Call AI
      const responseText = await generateResponseForActiveMode(contextMessages, {
        signal: controller.signal,
        onStream: (partialText) => {
          setStreamingResponse(partialText);
        },
      });
      
      // 4. Add AI response
      if (responseText.trim()) {
        actions.addMessage(id, 'assistant', responseText);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const message = (error as Error).message || 'Failed to get response from AI service.';
        console.error(error);

        if (message.toLowerCase().includes('image input')) {
          Alert.alert(
            'Vision model unavailable',
            'The selected provider/model could not process image input. Try another Ollama model/runtime or switch to Cloud mode for image chats.'
          );
          actions.addMessage(
            id,
            'system',
            'Image analysis failed for the selected model/runtime. Try another Ollama model or switch to Cloud mode.'
          );
        } else {
          Alert.alert('Error', message);
          const isLikelyFlaskConnectivityIssue =
            inferenceMode === 'flask' &&
            (message.toLowerCase().includes('network request failed') ||
              message.toLowerCase().includes('failed to fetch') ||
              message.toLowerCase().includes('connection'));
          const isLikelyKaggleConnectivityIssue =
            inferenceMode === 'kaggle' &&
            (message.toLowerCase().includes('network request failed') ||
              message.toLowerCase().includes('failed to fetch') ||
              message.toLowerCase().includes('connection') ||
              message.toLowerCase().includes('gradio') ||
              message.toLowerCase().includes('submit failed') ||
              message.toLowerCase().includes('poll failed') ||
              message.toLowerCase().includes('event_id'));

          actions.addMessage(
            id,
            'system',
            isLikelyFlaskConnectivityIssue
              ? `Flask API connection failed. Verify Flask is running and reachable at ${flaskBaseUrl}.`
              : isLikelyKaggleConnectivityIssue
                ? `Kaggle Space request failed. Verify the Gradio URL is correct and public: ${kaggleGradioUrl}.`
              : 'AI service connection failed. Check your selected inference mode settings.'
          );
        }
      }
    } finally {
      sendingRef.current = false;
      abortControllerRef.current = null;
      setStreamingResponse('');
      setLoading(false);
      setSelectedImageUri(null);
    }
  };

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera permission is required to capture images.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImageUri(normalizePickedImageUri(result.assets[0]));
    }
  };

  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery permission is required to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      selectionLimit: 1,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImageUri(normalizePickedImageUri(result.assets[0]));
    }
  };

  const handleAnalyzeSelectedImage = async (imageUri: string) => {
    try {
      const analysis = await analyzeImageWithMedsiglip(
        imageUri,
        'Describe this medical image for research/demo use, summarize visible features, and avoid diagnosis or treatment claims.'
      );

      if (!analysis.trim()) {
        Alert.alert('No analysis returned', 'Image analyzer responded but returned no text.');
      } else {
        Alert.alert('Analysis ready', 'Image findings were added to the message box.');
      }

      return analysis;
    } catch (error) {
      const message = (error as Error).message || 'Image analyzer failed.';
      Alert.alert('Image analyzer error', message);
      return '';
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={[styles.container, { paddingBottom: keyboardVisible ? 0 : insets.bottom }]}>      
        <Stack.Screen options={{ title: currentSession.title || 'Chat' }} />
          
        <View style={[styles.listContainer, { paddingBottom: 20 }] }>
          <FlatList
            ref={flatListRef}
            data={displayedMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <MessageItem message={item} />}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 10 }} /> : null}
          />
        </View>

        <InputArea
          style={{ paddingBottom: keyboardVisible ? 0 : insets.bottom }}
          onSend={handleSend}
          onCamera={handleCamera}
          onGallery={handleGallery}
          onMic={() => Alert.alert('Voice', 'Coming in next update')}
          onAnalyzeImage={handleAnalyzeSelectedImage}
          textValue={composerText}
          onTextChange={setComposerText}
          loading={loading}
          selectedImageUri={selectedImageUri}
          onClearImage={() => setSelectedImageUri(null)}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  listContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
    paddingBottom: 20, // extra bottom space (keyboard height is added dynamically)
  }
});
