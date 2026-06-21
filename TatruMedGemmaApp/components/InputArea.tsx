import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface InputAreaProps {
  onSend: (text: string, imageUri?: string) => void;
  onCamera: () => void;
  onGallery: () => void;
  onMic: () => void;
  onAnalyzeImage?: (imageUri: string) => Promise<string>;
  textValue?: string;
  onTextChange?: (value: string) => void;
  loading?: boolean;
  selectedImageUri?: string | null;
  onClearImage?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSend,
  onCamera,
  onGallery,
  onMic,
  onAnalyzeImage,
  textValue,
  onTextChange,
  loading,
  selectedImageUri,
  onClearImage,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const [internalText, setInternalText] = useState('');
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const text = textValue ?? internalText;
  const setText = onTextChange ?? setInternalText;

  const handleSend = () => {
    if ((!text.trim() && !selectedImageUri) || loading || analyzingImage) return;
    onSend(text.trim() || 'Please analyze this image.', selectedImageUri || undefined);
    setText('');
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImageUri || !onAnalyzeImage || loading || analyzingImage) {
      return;
    }

    setAnalyzingImage(true);
    try {
      const analysis = (await onAnalyzeImage(selectedImageUri)).trim();
      if (!analysis) {
        return;
      }

      setText((prev) => {
        const current = prev.trim();
        if (!current) {
          return analysis;
        }

        return `${current}\n\n${analysis}`;
      });
    } finally {
      setAnalyzingImage(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        style,
        {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom || 8,
        },
      ]}
    >
      {!!selectedImageUri && (
        <View style={styles.attachmentRow}>
          <Text style={styles.attachmentText}>Image attached for experimental review</Text>
          <View style={styles.attachmentActions}>
            {!!onAnalyzeImage && (
              <TouchableOpacity
                onPress={handleAnalyzeImage}
                disabled={loading || analyzingImage}
                style={styles.attachmentAnalyzeButton}
              >
                <Text style={styles.attachmentAnalyzeText}>
                  {analyzingImage ? 'Drafting...' : 'Draft Notes'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClearImage}>
              <Text style={styles.attachmentClear}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.inputContainer}>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onCamera} style={styles.iconButton}>
            <Ionicons name="camera" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onGallery} style={styles.iconButton}>
            <Ionicons name="images" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMic} style={styles.iconButton}>
            <Ionicons name="mic" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Ask a question or describe the image..."
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity 
          onPress={handleSend} 
          disabled={(!text.trim() && !selectedImageUri) || loading || analyzingImage}
          style={[
            styles.sendButton,
            ((!text.trim() && !selectedImageUri) || loading || analyzingImage) && styles.sendButtonDisabled,
          ]}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Should adjust based on Safe Area
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  attachmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachmentAnalyzeButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  attachmentAnalyzeText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },
  attachmentText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentClear: {
    color: '#ff3b30',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    marginRight: 8,
    marginBottom: 8, // Align with input bottom
  },
  iconButton: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0c4de',
  }
});
