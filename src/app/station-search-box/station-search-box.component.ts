import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef } from '@angular/core';
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
export class StationSearchBoxComponent implements OnInit, OnChanges {
  @Input() label: string = '';
  @Input() selectedStation: Station | null = null;
  @Output() stationSelected = new EventEmitter<Station | null>();
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  showPopup = false;
  stations: Station[] = [];
  filteredStations: Station[] = [];
  searchText = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Station[]>('assets/stations.json').subscribe(data => {
      this.stations = data;
      this.filteredStations = data;
    });
  }

  ngOnChanges(): void {
    // If selectedStation input changes, update local selectedStation
    this.selectedStation = this.selectedStation;
  }

  openPopup() {
    this.showPopup = true;
    this.searchText = '';
    this.filteredStations = this.stations;
    // Focus the search input after the view is updated
    setTimeout(() => {
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  onSelectedStationBoxClick() {
    this.openPopup();
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
