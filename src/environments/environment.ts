// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  iceServers: [
    {urls: [
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ]}
  ],
  socketUrl: 'http://localhost:3000',
  // socketUrl: 'https://srv01.naris-grc.com:443',
  // iceServers: [
  //   {urls: 'stun:srv02.naris-grc.com:80'},
  //   {urls: 'turn:srv02.naris-grc.com:80', username: 'gSTw57s6FaWk', credential: 'DwSWp)r?7J[L%xfz'}
  // ],
  // socketUrl: 'http://srv01.naris-grc.com:3000',
  socketOptions: {path: '/collaborate', auth: {token: 'Naris', pw: 'Naris'}}
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
