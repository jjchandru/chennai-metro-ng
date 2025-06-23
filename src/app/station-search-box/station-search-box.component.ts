import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

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

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Only load data in browser, not during prerendering
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<Station[]>('assets/stations.json').subscribe(data => {
        // Sort stations alphabetically by name
        this.stations = data.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredStations = this.stations;
      });
    } else {
      // During prerendering, use empty arrays
      this.stations = [];
      this.filteredStations = [];
    }
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
    const filtered = this.stations.filter(station =>
      station.name.toLowerCase().includes(text) ||
      station.tamil.includes(text)
    );
    // Sort filtered results alphabetically by station name
    this.filteredStations = filtered.sort((a, b) => a.name.localeCompare(b.name));
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
