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
    this.startAudio();
    this.rtcService.enterRoom(room);
    this.socketService.onMessage().pipe(takeUntil(this.rtcService.endConnection$)).subscribe(data => this.messages.push(data));
  }

  public leaveRoom(): void {
    this.rtcService.leaveRoom(this.roomName);
    this.router.navigate(['/']);
  }

  public submitMessage(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !!this.currentMessage) {
      event.preventDefault();
      this.socketService.sendMessage(this.roomName, this.currentMessage);
      this.currentMessage = null;
    }
  }

  public maxCols(max: number): number {
    const streams = Object.keys(this.streamService.remoteStreams).length || 1;
    return streams <= max ? streams : max;
  }

  public startAudio(): void {
    if (!this.audio) {
      this.audio = new Audio('../assets/all_by_myself.mp3');
      this.audio.load();
    }
    this.audioStarted = true;
    this.audio.play();
  }

  public stopAudio(): void {
    this.audio?.pause();
    this.audio.currentTime = 0;
    this.audioStarted = false;
  }

  public ngOnDestroy(): void {
    this.stopAudio();
    this.rtcService._endConnection$.next();
  }
}
