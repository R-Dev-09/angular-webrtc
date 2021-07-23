import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {

  public safeUrl: SafeResourceUrl;

  constructor(private _sanitizer: DomSanitizer) {
    this.safeUrl = this._sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=0&autoplay=1');
  }
}
