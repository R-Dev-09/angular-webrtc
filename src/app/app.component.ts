import { Component, OnDestroy } from '@angular/core';
import { RtcService, StreamService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

  constructor(public rtcService: RtcService, public streamService: StreamService) {}

  public ngOnDestroy(): void {
    this.rtcService._endConnection$.next();
  }
}
