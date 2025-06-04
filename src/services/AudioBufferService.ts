import { AudioBufferConfig } from '../types';

export class AudioBufferService {
  private buffers: Map<string, Float32Array[]>;
  private configs: Map<string, AudioBufferConfig>;
  private isRecording: Map<string, boolean>;

  constructor() {
    this.buffers = new Map();
    this.configs = new Map();
    this.isRecording = new Map();
  }

  startBuffer(pattern: string, config: AudioBufferConfig): void {
    if (!config.enabled) return;

    this.configs.set(pattern, config);
    this.buffers.set(pattern, []);
    this.isRecording.set(pattern, true);
  }

  stopBuffer(pattern: string): void {
    this.isRecording.set(pattern, false);
    this.buffers.delete(pattern);
    this.configs.delete(pattern);
  }

  addAudioData(pattern: string, data: Float32Array): void {
    if (!this.isRecording.get(pattern)) return;

    const config = this.configs.get(pattern);
    if (!config) return;

    const buffer = this.buffers.get(pattern);
    if (!buffer) return;

    // Add new data to buffer
    buffer.push(data);

    // Calculate how many samples to keep based on duration
    const maxSamples = config.duration * config.sampleRate;
    let currentSamples = buffer.reduce((sum, arr) => sum + arr.length, 0);

    // Remove old data if buffer is too large
    while (currentSamples > maxSamples && buffer.length > 0) {
      const removed = buffer.shift();
      if (removed) {
        currentSamples -= removed.length;
      }
    }
  }

  getBuffer(pattern: string): Float32Array[] | null {
    return this.buffers.get(pattern) || null;
  }

  exportBuffer(pattern: string): Blob | null {
    const buffer = this.buffers.get(pattern);
    const config = this.configs.get(pattern);
    if (!buffer || !config) return null;

    // Concatenate all audio data
    const totalLength = buffer.reduce((sum, arr) => sum + arr.length, 0);
    const audioData = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of buffer) {
      audioData.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to WAV format
    const wavData = this.convertToWAV(audioData, config.sampleRate);
    return new Blob([wavData], { type: 'audio/wav' });
  }

  private convertToWAV(audioData: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const volume = 1;
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i])) * volume;
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
} 