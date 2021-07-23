export interface MediaStreams {
  [id: string]: MediaStream;
}

export interface PeerConnections {
  [id: string]: RTCPeerConnection;
}

export interface PeerData {
  type: 'offer' | 'answer' | 'candidate';
  socketId: string;
  offer?: {type: 'offer'; sdp: any};
  answer?: {type: 'answer', sdp: any};
  candidate: any;
  userName: string;
}

export interface RoomEvent {
  type: 'joined' | 'left';
  room: string;
  socketId: string;
  userName: string;
}

export interface MessageData {
  socketId: string;
  msg: string;
  userName: string;
}
