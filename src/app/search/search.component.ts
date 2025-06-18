import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnChanges {
  fromStation: any = null;
  toStation: any = null;
  language: 'en' | 'ta' = 'ta'; // Set Tamil as default

  @Input() selectedLanguage: 'en' | 'ta' = 'ta'; // Receive language from parent
  @Output() journeySelected = new EventEmitter<{from: string, to: string, language: 'en' | 'ta'}>();
  @Output() languageChanged = new EventEmitter<'en' | 'ta'>();

  ngOnChanges(changes: SimpleChanges): void {
    // Update local language when parent language changes (from localStorage)
    if (changes['selectedLanguage'] && changes['selectedLanguage'].currentValue !== this.language) {
      this.language = changes['selectedLanguage'].currentValue;
      this.emitJourneyIfReady();
    }
  }

  emitJourneyIfReady() {
    if (this.fromStation && this.toStation) {
      if (this.fromStation.name === this.toStation.name) {
        this.journeySelected.emit({from: '', to: '', language: this.language}); // Prevent journey plan for same station
      } else {
        this.journeySelected.emit({from: this.fromStation.name, to: this.toStation.name, language: this.language});
      }
    }
  }

  onFromStationSelected(station: any) {
    this.fromStation = station;
    if (!station) {
      this.journeySelected.emit({from: '', to: '', language: this.language}); // Clear journey plan if from is cleared
    } else {
      this.emitJourneyIfReady();
    }
  }

  onToStationSelected(station: any) {
    this.toStation = station;
    if (!station) {
      this.journeySelected.emit({from: '', to: '', language: this.language}); // Clear journey plan if to is cleared
    } else {
      this.emitJourneyIfReady();
    }
  }

  swapStations() {
    const temp = this.fromStation;
    this.fromStation = this.toStation;
    this.toStation = temp;
    this.emitJourneyIfReady();
  }

  setLanguage(lang: 'en' | 'ta') {
    if (this.language !== lang) {
      this.language = lang;
      this.languageChanged.emit(lang);
      this.emitJourneyIfReady();
    }
  }
}
