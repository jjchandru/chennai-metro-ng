import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Station {
  name: string;
  tamil: string;
}

@Component({
  selector: 'app-station-search-box',
  templateUrl: './station-search-box.component.html',
  styleUrls: ['./station-search-box.component.css']
})
export class StationSearchBoxComponent implements OnInit {
  @Input() label: string = '';
  @Output() stationSelected = new EventEmitter<Station | null>();

  showPopup = false;
  stations: Station[] = [];
  filteredStations: Station[] = [];
  searchText = '';
  selectedStation: Station | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Station[]>('assets/stations.json').subscribe(data => {
      this.stations = data;
      this.filteredStations = data;
    });
  }

  openPopup() {
    this.showPopup = true;
    this.searchText = '';
    this.filteredStations = this.stations;
  }

  closePopup() {
    this.showPopup = false;
  }

  filterStations() {
    const text = this.searchText.trim().toLowerCase();
    this.filteredStations = this.stations.filter(station =>
      station.name.toLowerCase().includes(text) ||
      station.tamil.includes(text)
    );
  }

  selectStation(station: Station) {
    this.selectedStation = station;
    this.stationSelected.emit(station);
    this.closePopup();
  }

  clearSelectedStation() {
    this.selectedStation = null;
    this.stationSelected.emit(null);
  }
}
