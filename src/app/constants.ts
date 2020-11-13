import { ComponentType } from '@angular/cdk/portal';
import { InjectionToken } from '@angular/core';
import { SocketIoConfig } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';

export const DIALOG_TOKEN = new InjectionToken<ComponentType<any>>('DIALOG_TOKEN');
export const CONNFIG = {
  iceServers: [
    {
      urls: environment.stunUrls
    },
  ],
  iceCandidatePoolSize: 10,
};
export const CONNECTIONS = 'connections';
export const PARTICIPANTS = 'participants';
export const SOCKET_CONFIG: SocketIoConfig = {url: environment.socketUrl, options: environment.socketOptions};
