// AudioStreamManager.js
// This utility manages audio streams separately from Redux since MediaStream objects can't be serialized

class AudioStreamManager {
  constructor() {
    this.streams = new Map(); // Map callId -> MediaStream object
    this.audioElements = new Map(); // Map callId -> HTMLAudioElement
  }

  // Add or update a stream for a specific call
  setStream(callId, stream) {
    if (!callId || !stream) return null;
    
    this.streams.set(callId, stream);
    
    // Generate a unique ID for this stream that can be stored in Redux
    const streamId = `stream_${callId}_${Date.now()}`;
    
    // Return streamId to store in Redux
    return streamId;
  }

  // Get a stream by callId
  getStream(callId) {
    return this.streams.get(callId) || null;
  }

  // Create and attach an audio element for a call
  attachAudioElement(callId, stream) {
    // Reuse existing audio element if available
    let audioElement = this.audioElements.get(callId);
    
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.id = `call-audio-${callId}`;
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
      this.audioElements.set(callId, audioElement);
    }
    
    if (stream) {
      audioElement.srcObject = stream;
      audioElement.play().catch(err => console.warn('Audio play error:', err));
    }
    
    return audioElement;
  }

  // Attach the peer connection's audio to a specific call
  attachPeerConnectionAudio(callId, peerConnection) {
    if (!peerConnection) return null;
    
    const remoteStream = new MediaStream();
    
    // Add existing audio tracks
    peerConnection.getReceivers().forEach(receiver => {
      if (receiver.track && receiver.track.kind === 'audio') {
        remoteStream.addTrack(receiver.track);
      }
    });
    
    // Add future audio tracks
    peerConnection.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        remoteStream.addTrack(event.track);
        // Update the stream
        this.streams.set(callId, remoteStream);
        // Update the audio element
        this.attachAudioElement(callId, remoteStream);
      }
    };
    
    // Set the stream
    const streamId = this.setStream(callId, remoteStream);
    
    // Create and attach the audio element
    this.attachAudioElement(callId, remoteStream);
    
    return streamId;
  }

  // Play a specific call audio (useful when switching between calls)
  playCallAudio(callId) {
    const audioElement = this.audioElements.get(callId);
    if (audioElement) {
      audioElement.play().catch(err => console.warn('Audio play error:', err));
    }
  }

  // Mute a specific call audio
  muteCallAudio(callId) {
    const audioElement = this.audioElements.get(callId);
    if (audioElement) {
      audioElement.muted = true;
    }
  }

  // Unmute a specific call audio
  unmuteCallAudio(callId) {
    const audioElement = this.audioElements.get(callId);
    if (audioElement) {
      audioElement.muted = false;
    }
  }

  // Remove a stream and its audio element
  removeStream(callId) {
    // Stop and remove audio element
    const audioElement = this.audioElements.get(callId);
    if (audioElement) {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.remove();
      this.audioElements.delete(callId);
    }
    
    // Remove stream
    this.streams.delete(callId);
  }

  // Clean up all streams and audio elements
  clearAll() {
    // Clean up all audio elements
    this.audioElements.forEach(audioElement => {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.remove();
    });
    
    // Clear the maps
    this.audioElements.clear();
    this.streams.clear();
  }
}

// Export a singleton instance of the manager
const audioStreamManager = new AudioStreamManager();
export default audioStreamManager;
