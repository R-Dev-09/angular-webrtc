import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, QuerySnapshot } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CONNFIG } from '../constants';
import { PeerConnections } from '../models';
import { StreamService } from './stream.service';

@Injectable({
  providedIn: 'root'
})
export class RtcService {

  private peerConnections: PeerConnections = {};
  private roomCollection = this.firestore.collection('ng-rooms');
  private roomsStarted: string[] = [];
  private _currentRoom: string;
  private _rooms$ = this.roomCollection.valueChanges({idField: 'id'});

  constructor(private firestore: AngularFirestore, private streamService: StreamService) {}

  public get currentRoom(): string {
    return this._currentRoom;
  }

  public get rooms$(): Observable<string[]> {
    return this._rooms$.pipe(map(changes => changes.map(r => r.id)));
  }

  public async createRoom(): Promise<void> {
    if (!this.streamService.localStream) await this.streamService.openLocalStream();
    const roomRef = await this.roomCollection.add({});
    this._currentRoom = roomRef.id;
    this.roomsStarted.push(roomRef.id);
    this.peerConnections['local'] = new RTCPeerConnection(CONNFIG);
    this.streamService.localStream.getTracks().forEach(track => this.peerConnections['local'].addTrack(track, this.streamService.localStream));
    const callerCandidates = roomRef.collection('callerCandidates');
    this.peerConnections['local'].addEventListener('icecandidate', event => {
      if (!!event.candidate) callerCandidates.add(event.candidate.toJSON());
    });
    const offer = await this.peerConnections['local'].createOffer();
    await this.peerConnections['local'].setLocalDescription(offer);
    await roomRef.set({offer: {type: offer.type, sdp: offer.sdp}});
    this.peerConnections['local'].addEventListener('track', this.streamHandler);
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!this.peerConnections['local'].currentRemoteDescription && !!data?.answer) {
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await this.peerConnections['local'].setRemoteDescription(rtcSessionDescription);
      }
    });
    roomRef.collection('calleeCandidates').onSnapshot(this.snapshotHandler);
  }

  public async joinRoom(roomId: string): Promise<void> {
    this._currentRoom = roomId;
    const roomSnapshot = await this.roomCollection.doc(roomId).get().toPromise();
    if (roomSnapshot.exists) {
      if (!this.streamService.localStream) await this.streamService.openLocalStream();
      this.peerConnections['local'] = new RTCPeerConnection(CONNFIG);
      this.streamService.localStream.getTracks().forEach(track => this.peerConnections['local'].addTrack(track, this.streamService.localStream));
      const calleeCandidates = this.roomCollection.doc(roomId).collection('calleeCandidates');
      this.peerConnections['local'].addEventListener('icecandidate', event => {
        if (!!event.candidate) calleeCandidates.add(event.candidate.toJSON());
      });
      this.peerConnections['local'].addEventListener('track', this.streamHandler);
      const roomData = roomSnapshot.data();
      await this.peerConnections['local'].setRemoteDescription(new RTCSessionDescription(roomData.offer));
      const roomRef = this.roomCollection.doc(roomId);
      const answer = await this.peerConnections['local'].createAnswer();
      await this.peerConnections['local'].setLocalDescription(answer);
      await roomRef.update({answer: {type: answer.type, sdp: answer.sdp}});
      this.roomCollection.doc(roomId).collection('callerCandidates').ref.onSnapshot(this.snapshotHandler);
    }
  }

  public hangUp(): void {
    this.streamService.closeStreams();
    for (const pc in this.peerConnections) {
      this.peerConnections[pc].close();
    }
    if (!!this.roomsStarted.length) this.roomsStarted.forEach(room => this.closeRoom(room));
  }

  private async closeRoom(roomId: string): Promise<void> {
    const roomRef = this.roomCollection.doc(roomId);
    const callerCandidates = await roomRef.collection('callerCandidates').get().toPromise();
    const calleeCandidates = await roomRef.collection('calleeCandidates').get().toPromise();
    const batch = this.firestore.firestore.batch();
    callerCandidates.docs.forEach(candidate => batch.delete(candidate.ref));
    calleeCandidates.docs.forEach(candidate => batch.delete(candidate.ref));
    await batch.commit();
    await roomRef.delete();
    this._currentRoom = null;
  }

  private streamHandler = (event: RTCTrackEvent): void => {
    const stream = event.streams[0];
    this.streamService.remoteStreams[stream.id] = stream;
    this.streamService.updateRemoteStreams();
  }

  private snapshotHandler = (snapshot: QuerySnapshot<DocumentData>): void => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        await this.peerConnections['local'].addIceCandidate(new RTCIceCandidate(data));
      }
    });
  }
}
