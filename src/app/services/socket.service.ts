import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { merge, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PeerData, RoomEvent } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private socket: Socket) {}

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

  public eventListeners(): Observable<RoomEvent | PeerData> {
    return merge(
      this.socket.fromEvent<RoomEvent>('joined'),
      this.socket.fromEvent<RoomEvent>('left'),
      this.socket.fromEvent<PeerData>('offer'),
      this.socket.fromEvent<PeerData>('answer'),
      this.socket.fromEvent<PeerData>('candidate')
    ).pipe(catchError(this.handleError));
  }

  private handleError = (err: HttpErrorResponse): Observable<never> => throwError(err);
}
