import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { SocketIoModule } from 'ngx-socket-io';

import { AppComponent } from './app.component';
import { SOCKET_CONFIG } from './constants';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatGridListModule,
    SocketIoModule.forRoot(SOCKET_CONFIG)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
