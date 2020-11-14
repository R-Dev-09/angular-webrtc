import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { merge, Observable, throwError } from 'rxjs';
import { catchError, throttleTime } from 'rxjs/operators';
import { MessageData, PeerData, RoomEvent } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private socket: Socket) {}

  public get socketId(): string {
    return this.socket.ioSocket.id;
  }

  public joinRoom(room: string): void {
    this.socket.emit('join', room);
  }

  public leaveRoom(room: string): void {
    this.socket.emit('leave', room);
  }

  public sendOffer(id: string, offer: any): void {
    this.socket.emit('offer', {id, offer});
  }

  public sendAnswer(id: string, answer: any): void {
    this.socket.emit('answer', {id, answer});
  }

  public sendCandidate(id: string, candidate: any): void {
    this.socket.emit('candidate', {id, candidate});
  }

  public sendMessage(room: string, msg: string): void {
    this.socket.emit('message', {room, msg});
  }

  public sendTyping(room: string): void {
    this.socket.emit('typing', room);
  }

  public typeListener(): Observable<string> {
    return this.socket.fromEvent<string>('typing').pipe(
      catchError(this.handleError),
      throttleTime(500)
    );
  }

  public peerListeners(): Observable<RoomEvent | PeerData> {
    return merge(
      this.socket.fromEvent<RoomEvent>('joined'),
      this.socket.fromEvent<RoomEvent>('left'),
      this.socket.fromEvent<PeerData>('offer'),
      this.socket.fromEvent<PeerData>('answer'),
      this.socket.fromEvent<PeerData>('candidate')
    ).pipe(catchError(this.handleError));
  }

  public messageListeners(): Observable<MessageData | MessageData[]> {
    return merge(
      this.socket.fromEvent<MessageData>('message'),
      this.socket.fromEvent<MessageData[]>('history')
    ).pipe(catchError(this.handleError));
  }

  private handleError = (err: HttpErrorResponse): Observable<never> => throwError(err);
}
