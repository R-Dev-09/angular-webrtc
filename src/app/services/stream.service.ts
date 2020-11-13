import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MediaStreams } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  private _localStream: MediaStream;
  private _remoteStreams: MediaStreams = {};
  private _remoteStreams$ = new BehaviorSubject<MediaStreams>({});

  public get localStream(): MediaStream {
    return this._localStream;
  }

  public get remoteStreams(): MediaStreams {
    return this._remoteStreams;
  }

  public get remoteStreams$(): Observable<MediaStreams> {
    return this._remoteStreams$.asObservable();
  }

  public async openLocalStream(constraintConfig: MediaStreamConstraints = {}): Promise<void> {
    if (!!this._localStream) alert('Local stream has alreay been opened!');
    else {
      const constraints: MediaStreamConstraints = {video: true, audio: true};
      try {
        this._localStream = await navigator.mediaDevices.getUserMedia({...constraints, ...constraintConfig});
      } catch (e) {
        console.error(e);
      }
    }
  }

  public closeLocalStream(): void {
    if (!this._localStream) alert('No stream to close!');
    else {
      this._localStream.getTracks().forEach(track => track.stop());
      this._localStream = null;
    }
  }

  public closeStream(id: string): void {
    const stream = this._remoteStreams[id];
    if (!!stream) {
      stream.getTracks().forEach(track => track.stop());
      delete this._remoteStreams[id];
      this.updateRemoteStreams();
    }
  }

  public closeStreams(): void {
    this.closeLocalStream();
    for (const id in this._remoteStreams) {
      this._remoteStreams[id].getTracks().forEach(track => track.stop());
      delete this._remoteStreams[id];
    }
    this.updateRemoteStreams();
  }

  public updateRemoteStreams(): void {
    this._remoteStreams$.next(this._remoteStreams);
  }

  public toggleAudioSelf(): void {
    const audio = this._localStream.getAudioTracks()[0];
    audio.enabled = !audio.enabled;
  }

  public toggleAudioOthers(): void {
    for (const id in this._remoteStreams) {
      const audio = this._remoteStreams[id].getAudioTracks()[0];
      audio.enabled = !audio.enabled;
    }
  }

  public toggleAudioAll(): void {
    this.toggleAudioSelf();
    this.toggleAudioOthers();
  }
}
