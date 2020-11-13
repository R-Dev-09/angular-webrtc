import { Component, OnDestroy } from '@angular/core';
import { RtcService, StreamService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

  public title = 'angular-webrtc';
  public roomName = 'Three Musketeers';

  constructor(public rtcService: RtcService, public streamService: StreamService) {}

  public ngOnDestroy(): void {
    this.rtcService._endConnection$.next();
  }

  public submit(event: KeyboardEvent): void {
    event.preventDefault();
    if (event.key === 'Enter') this.rtcService.enterRoom(this.roomName);
  }

  public getCols(): number {
    const streams = Object.keys(this.streamService.remoteStreams).length || 1;
    return streams <= 2 ? streams : 2;
  }
}
