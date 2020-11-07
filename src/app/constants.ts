import { ComponentType } from '@angular/cdk/portal';
import { InjectionToken } from '@angular/core';

export const DIALOG_TOKEN = new InjectionToken<ComponentType<any>>('DIALOG_TOKEN');
export const CONNFIG = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};
