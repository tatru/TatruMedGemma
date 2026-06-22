# Epic 3: Multimedia Capabilities

## Overview
Enhance the prototype chat experience by allowing users to share image context now and audio context later.

## User Stories

### US3.1: Image Input from Camera/Gallery
**As a** user,
**I want** to take photos of my symptoms (e.g., rash, wound) or upload existing ones,
**So that** the prototype can include image context for experimental analysis.

### US3.2: Voice Input (Speech-to-Text)
**As a** user,
**I want** to speak my symptoms instead of typing,
**So that** I can describe observations more naturally and quickly.

### US3.3: Audio Input (Symptom Recording)
**As a** user,
**I want** to record sounds like coughing or breathing,
**So that** the prototype can experiment with auditory context.

### US3.4: Multimedia Storage Management
**As a** user,
**I want** to manage (view/delete) the media files associated with my chats,
**So that** I maintain control over uploaded prototype data.

## Progress

- Done: US3.1. Camera/gallery image attachment is implemented; selected images render in chat and can be passed into the optional MedSigLIP pre-analysis flow when that LAN service is configured.
- Partial: US3.2. Voice input is not implemented yet; the mic action currently shows a placeholder alert.
- Partial: US3.3. Audio symptom recording/transcription is not implemented yet. MedASR settings exist in configuration, but there is no end-to-end capture and transcription flow in the current app.
- Partial: US3.4. Users can delete sessions and clear current attachments, but there is no dedicated media-management screen or file browser.
