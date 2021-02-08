import { environment } from 'src/environments/environment';

export const CONNFIG = {iceServers: [{urls: environment.stunUrls}], iceCandidatePoolSize: 10};
export const SOCKET_CONFIG = {url: environment.socketUrl, options: environment.socketOptions};
