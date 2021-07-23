import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { StreamService } from './stream.service';
import { PeerConnections, PeerData, RoomEvent } from '../models';
import { CONNFIG } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class RtcService {

  public _endConnection$ = new Subject<void>();
  private peerConnections: PeerConnections = {};
  private _currentRoom: string;

  constructor(private streamService: StreamService, private socketService: SocketService) {}

  public get endConnection$(): Observable<void> {
    return this._endConnection$.asObservable();
  }

  public get currentRoom(): string {
    return this._currentRoom;
  }

  public async enterRoom(room: string): Promise<void> {
    this._currentRoom = room;
    if (!this.streamService.localStream) await this.streamService.openLocalStream({audio: true});
    if (!this.socketService.connected) this.socketService.openSocket();
    // if (!this.streamService.hostStream) await this.streamService.openHostStream();
    this.socketService.peerListeners().pipe(takeUntil(this.endConnection$)).subscribe(data => {
      switch (data.type) {
        case 'joined': this.handleJoined(data); break;
        case 'left': this.handleLeft(data); break;
        case 'offer': this.handleOffer(data); break;
        case 'answer': this.handleAnswer(data); break;
        case 'candidate': this.handleCandidate(data); break;
        default: console.error('No type could be determined from data!');
      }
    }, console.error);
    this.socketService.joinRoom(room);
  }

  public leaveRoom(room: string): void {
    this.streamService.closeStreams();
    this.socketService.leaveRoom(room);
    for (const id in this.peerConnections) {
      this.peerConnections[id].close();
      delete this.peerConnections[id];
    }
    this._endConnection$.next();
  }

  private async handleJoined(data: RoomEvent): Promise<void> {
    const peerConnection = await this.createPeerConnection(data.socketId, data.userName);
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      this.socketService.sendOffer(data.socketId, {type: offer.type, sdp: offer.sdp});
    } catch (e) {
      console.error(e);
    }
  }

  private handleLeft(data: RoomEvent): void {
    this.peerConnections[data.socketId]?.close();
    this.streamService.closeStream(data.socketId);
    delete this.peerConnections[data.socketId];
  }

  private async handleOffer(data: PeerData): Promise<void> {
    const peerConnection = await this.createPeerConnection(data.socketId, data.userName);
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      this.socketService.sendAnswer(data.socketId, {type: answer.type, sdp: answer.sdp});
    } catch (e) {
      console.error(e);
    }
  }

  private async handleAnswer(data: PeerData): Promise<void> {
    const peerConnection = this.peerConnections[data.socketId];
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (e) {
      console.error(e);
    }
  }

  private async handleCandidate(data: PeerData): Promise<void> {
    const peerConnection = this.peerConnections[data.socketId];
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
      console.error(e);
    }
  }

  private async createPeerConnection(socketId: string, userName: string, host = false): Promise<RTCPeerConnection> {
    const peerConnection = this.peerConnections[socketId] = new RTCPeerConnection(CONNFIG);
    host ? await this.streamService.openHostStream() : await this.streamService.openLocalStream();
    const stream = host ? this.streamService.hostStream : this.streamService.localStream;
    console.log(stream);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    peerConnection.addEventListener('icecandidate', event => {
      if (!!event.candidate) this.socketService.sendCandidate(socketId, event.candidate.toJSON());
    });
    peerConnection.addEventListener('track', event => {
      const remoteStream = event.streams[0];
      remoteStream['userName'] = userName;
      this.streamService.remoteStreams[socketId] = remoteStream;
    });
    return peerConnection;
  }
}
