export const environment = {
  production: true,
  iceServers: [
    {urls: [
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ]}
  ],
  socketUrl: 'http://localhost:3000',
  socketOptions: {}
};
