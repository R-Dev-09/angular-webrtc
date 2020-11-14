import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {

  public roomName = 'Three Musketeers';

  constructor(private router: Router) {}

  public toRoom(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.router.navigate([`/room/${this.roomName}`]);
    }
  }
}
