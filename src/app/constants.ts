import { SocketIoConfig } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';

export const CONNFIG = {iceServers: [{urls: environment.stunUrls}], iceCandidatePoolSize: 10};
export const SOCKET_CONFIG: SocketIoConfig = {url: environment.socketUrl, options: environment.socketOptions};
