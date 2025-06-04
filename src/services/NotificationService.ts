import { Device } from '../types';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  sound?: string;
  vibration?: number[];
  priority?: 'high' | 'normal' | 'low';
}

export class NotificationService {
  private hasPermission: boolean = false;
  private notificationSupported: boolean = false;

  constructor() {
    this.notificationSupported = 'Notification' in window;
    this.checkPermission();
  }

  private async checkPermission() {
    if (!this.notificationSupported) return;

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.notificationSupported) return false;

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  async notifyDeviceStatus(device: Device, status: string, confidence: number) {
    const options: NotificationOptions = {
      title: `${device.name} Status Update`,
      body: `${status} (Confidence: ${Math.round(confidence * 100)}%)`,
      priority: 'high',
      vibration: [200, 100, 200]
    };

    await this.sendNotification(options);
  }

  async notifyPatternDetected(device: Device, pattern: string, confidence: number) {
    const options: NotificationOptions = {
      title: `Pattern Detected: ${pattern}`,
      body: `Detected in ${device.name} with ${Math.round(confidence * 100)}% confidence`,
      priority: 'high',
      vibration: [200, 100, 200]
    };

    await this.sendNotification(options);
  }

  async notifyError(device: Device, error: string) {
    const options: NotificationOptions = {
      title: `Error with ${device.name}`,
      body: error,
      priority: 'high',
      vibration: [500, 100, 500]
    };

    await this.sendNotification(options);
  }

  private async sendNotification(options: NotificationOptions) {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if (this.notificationSupported) {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        silent: !options.sound,
        vibrate: options.vibration,
        requireInteraction: true
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Fallback for platforms without Notification API
    if (!this.notificationSupported) {
      console.log(`[Notification] ${options.title}: ${options.body}`);
    }
  }

  // Platform-specific notification methods
  async sendSMS(phoneNumber: string, message: string) {
    // Implement SMS sending logic here
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
  }

  async sendEmail(email: string, subject: string, body: string) {
    // Implement email sending logic here
    console.log(`[Email] To: ${email}, Subject: ${subject}, Body: ${body}`);
  }

  async sendVoiceAlert(message: string) {
    // Implement voice alert logic here
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
    }
  }
} 