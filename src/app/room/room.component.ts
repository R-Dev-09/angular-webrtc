import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { MessageData } from '../models';
import { RtcService, SocketService, StreamService } from '../services';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {

  public messages: MessageData[] = [];
  public currentMessage: string;
  public audio: HTMLAudioElement;
  public roomName: string;
  public audioStarted: boolean;
  public typer: string;
  public typeout: any;

  constructor(
    public streamService: StreamService,
    public socketService: SocketService,
    public rtcService: RtcService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const room = this.route.snapshot.params.id;
    this.roomName = room;
    this.rtcService.enterRoom(room);
    this.socketService.messageListeners().pipe(takeUntil(this.rtcService.endConnection$)).subscribe(data => {
      if (Array.isArray(data)) this.messages = data;
      else this.messages.push(data);
    });
    this.socketService.typeListener().pipe(takeUntil(this.rtcService.endConnection$)).subscribe(userName => {
      this.typer = userName;
      if (!!this.typeout) clearTimeout(this.typeout);
      this.typeout = setTimeout(() => this.typer = null, 2000);
    });
  }

  public leaveRoom(): void {
    this.rtcService.leaveRoom(this.roomName);
    this.socketService.closeSocket();
    this.router.navigate(['/']);
  }

  public submitMessage(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !!this.currentMessage) {
      event.preventDefault();
      this.socketService.sendMessage(this.roomName, this.currentMessage);
      this.currentMessage = null;
    } else this.socketService.sendTyping(this.roomName);
  }

  public maxCols(max: number): number {
    const streams = Object.keys(this.streamService.remoteStreams).length || 1;
    return streams <= max ? streams : max;
  }

  public ngOnDestroy(): void {
    this.rtcService._endConnection$.next();
  }
}
