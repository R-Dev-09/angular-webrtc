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
}

export interface RoomEvent {
  type: 'joined' | 'left';
  room: string;
  socketId: string;
}

export interface MessageData {
  socketId: string;
  msg: string;
}
