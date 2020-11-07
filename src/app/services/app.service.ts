import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference } from '@angular/fire/firestore';
import { CONNFIG } from '../constants';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  public localStream: MediaStream;
  public remoteStream: MediaStream;
  public rooms = [];
  public currentRoom: string;
  private _connections: {[key: string]: RTCPeerConnection} = {};

  constructor(private firestore: AngularFirestore) {}

  public async openMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
      this.remoteStream = new MediaStream();
    } catch (e) {
      console.log(e);
      throwError(e);
    }
  }

  public closeMedia(): void {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.remoteStream = null;
  }

  public async hangUp(): Promise<void> {
    this.closeMedia();
    for (const pc in this._connections) {
      this._connections[pc].close();
    }
    if (!!this.currentRoom) {
      const roomRef = this.firestore.collection('ng-rooms').doc(this.currentRoom);
      const callerCandidates = await roomRef.collection('callerCandidates').get().toPromise();
      const calleeCandidates = await roomRef.collection('calleeCandidates').get().toPromise();
      const batch = this.firestore.firestore.batch();
      callerCandidates.docs.forEach(candidate => batch.delete(candidate.ref));
      calleeCandidates.docs.forEach(candidate => batch.delete(candidate.ref));
      await batch.commit();
      await roomRef.delete();
      this.currentRoom = null;
      this.rooms = [];
    }
    // document.location.reload();
  }

  public async getRooms(): Promise<void> {
    this.rooms = (await this.firestore.collection('ng-rooms').get().toPromise()).docs.map(doc => doc.id);
    const roomRef = this.firestore.collection('ng-rooms').ref;
    roomRef.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        console.log(change);
        if (change.type === 'added') this.rooms.push(change.doc.id);
        if (change.type === 'removed') this.rooms = this.rooms.filter(room => room !== change.doc.id);
      });
    });
  }

  public async createRoom(): Promise<void> {
    const roomRef = await this.firestore.collection('ng-rooms').add({});
    this.currentRoom = roomRef.id;
    this.setupPeerConnection('local');
    this.setupTracks('local');
    const callerCandidates = roomRef.collection('callerCandidates');
    this.setupCandidates('local', callerCandidates);
    this.setupDescription('local', roomRef);
    this.setupTrackListener('local');

    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!this._connections['local'].currentRemoteDescription && !!data?.answer) {
        console.log('Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await this._connections['local'].setRemoteDescription(rtcSessionDescription);
      }
    });

    roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log('Got new remote ICE candidate: ' + JSON.stringify(data));
          await this._connections['local'].addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  public async joinRoom(roomId: string): Promise<void> {
    const roomRef = this.firestore.collection('ng-rooms').doc(roomId);
    const roomSnapshot = await roomRef.get().toPromise();
    console.log('Got room: ', roomSnapshot.exists);
    if (roomSnapshot.exists) {
      console.log('Create PeerConnection with configuration: ', CONNFIG);
      this.setupPeerConnection('remote');
      this.setupTracks('remote');
      const calleeCandidates = roomRef.collection('calleeCandidates');
      this.setupCandidates('remote', calleeCandidates);
      this.setupTrackListener('remote');
      this.setupDescription('remote', roomRef, roomSnapshot);

      roomRef.ref.collection('callerCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            console.log('Got new remote ICE candidate: ' + JSON.stringify(data));
            await this._connections['remote'].addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    }
  }

  private setupPeerConnection(name: string): RTCPeerConnection {
    this._connections[name] = new RTCPeerConnection(CONNFIG);
    this.registerPeerConnectionListeners(name);
    return this._connections[name];
  }

  private setupTracks(type: 'local' | 'remote'): void {
    this.localStream.getTracks().forEach(track => this._connections[type].addTrack(track, this.localStream));
  }

  private setupCandidates(type: 'local' | 'remote', collection: AngularFirestoreCollection | CollectionReference): void {
    this._connections[type].addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      collection.add(event.candidate.toJSON());
    });
  }

  private async setupDescription(type: 'local' | 'remote', roomRef?: any, roomSnapshot?: any): Promise<void> {
    if (type === 'local') {
      const offer = await this._connections[type].createOffer();
      await this._connections[type].setLocalDescription(offer);
      console.log('Created offer: ', offer);

      const roomWithOffer = {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      };
      await roomRef.set(roomWithOffer);
      console.log('New room created with SDP offer. Room ID: ' + roomRef.id);
    } else {
      const offer = roomSnapshot.data().offer;
      console.log('Got offer: ', offer);
      await this._connections[type].setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this._connections[type].createAnswer();
      console.log('Created answer: ', answer);
      await this._connections[type].setLocalDescription(answer);

      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      };

      await roomRef.update(roomWithAnswer);
    }
  }

  private setupTrackListener(type: 'local' | 'remote'): void {
    this._connections[type].addEventListener('track', event => {
      console.log('Got remote track: ', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream: ', track);
        this.remoteStream.addTrack(track);
      });
    });
  }

  private registerPeerConnectionListeners(name: string): void {
    const pc = this._connections[name];
    pc.addEventListener('icegatheringstatechange', () => console.log(`ICE gathering state changed: ${pc.iceGatheringState}`));
    pc.addEventListener('connectionstatechange', () => console.log(`Connection state change: ${pc.connectionState}`));
    pc.addEventListener('signalingstatechange', () => console.log(`Signaling state change: ${pc.signalingState}`));
    pc.addEventListener('iceconnectionstatechange', () => console.log(`ICE connection state change: ${pc.iceConnectionState}`));
  }
}
