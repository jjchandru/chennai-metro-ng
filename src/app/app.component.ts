import { Component } from '@angular/core';

interface Station {
  name: string;
  tamil: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chennai-metro-ng';
  selectedStation: Station | null = null;

  onStationSelected(station: Station | null) {
    this.selectedStation = station;
  }
}
