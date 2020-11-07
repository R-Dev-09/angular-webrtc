import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppService } from './services/app.service';
import { RtcService } from './services/rtc.service';
import { StreamService } from './services/stream.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  public rooms: string[] = [];
  private subs: Subscription[];

  constructor(public appService: AppService, public rtcService: RtcService, public streamService: StreamService) {}

  public ngOnInit(): void {
    this.subs = [this.rtcService.rooms$.subscribe(rooms => this.rooms = rooms)];
  }

  public ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
