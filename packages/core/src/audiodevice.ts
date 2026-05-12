import { sendCommand, DaemonError } from './daemon.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioDeviceData {
  id: number;
  name: string;
  isInput: boolean;
  isOutput: boolean;
}

function isAudioDeviceData(value: unknown): value is AudioDeviceData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.isInput === 'boolean' &&
    typeof v.isOutput === 'boolean'
  );
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class AudioDevice {
  readonly id: number;
  readonly name: string;
  readonly isInput: boolean;
  readonly isOutput: boolean;

  constructor(data: AudioDeviceData) {
    this.id = data.id;
    this.name = data.name;
    this.isInput = data.isInput;
    this.isOutput = data.isOutput;
  }

  async mute(): Promise<void> {
    await sendCommand({ audiodevice: { action: 'mute', deviceId: this.id } });
  }

  async unmute(): Promise<void> {
    await sendCommand({ audiodevice: { action: 'unmute', deviceId: this.id } });
  }

  static async defaultInput(): Promise<AudioDevice | null> {
    return AudioDevice.fetchDefault('defaultInput');
  }

  static async defaultOutput(): Promise<AudioDevice | null> {
    return AudioDevice.fetchDefault('defaultOutput');
  }

  private static async fetchDefault(action: 'defaultInput' | 'defaultOutput'): Promise<AudioDevice | null> {
    try {
      const res = await sendCommand({ audiodevice: { action } });
      if (!isAudioDeviceData(res.result)) return null;
      return new AudioDevice(res.result);
    } catch (err) {
      if (err instanceof DaemonError) return null;
      throw err;
    }
  }
}
