import { Component, OnInit } from '@angular/core';

interface Station {
  name: string;
  tamil: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'chennai-metro-ng';
  selectedStation: Station | null = null;
  fromStationName: string | null = null;
  toStationName: string | null = null;
  selectedLanguage: 'en' | 'ta' = 'ta'; // Default to Tamil as requested

  ngOnInit(): void {
    // Load language from localStorage on app initialization
    this.loadLanguageFromStorage();
  }

  private loadLanguageFromStorage(): void {
    try {
      const savedLanguage = localStorage.getItem('chennai-metro-language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ta')) {
        this.selectedLanguage = savedLanguage as 'en' | 'ta';
      } else {
        // If no saved language or invalid language, set default to Tamil
        this.selectedLanguage = 'ta';
        this.saveLanguageToStorage();
      }
    } catch (error) {
      console.warn('Error loading language from localStorage:', error);
      // Fallback to Tamil if localStorage is not available
      this.selectedLanguage = 'ta';
    }
  }

  private saveLanguageToStorage(): void {
    try {
      localStorage.setItem('chennai-metro-language', this.selectedLanguage);
    } catch (error) {
      console.warn('Error saving language to localStorage:', error);
    }
  }

  onStationSelected(station: Station | null) {
    this.selectedStation = station;
  }

  onJourneySelected(journey: {from: string, to: string, language: 'en' | 'ta'}) {
    this.fromStationName = journey.from;
    this.toStationName = journey.to;
    if (journey.language) {
      this.selectedLanguage = journey.language;
      this.saveLanguageToStorage(); // Save language when changed via journey selection
    }
  }

  onLanguageChanged(lang: 'en' | 'ta') {
    this.selectedLanguage = lang;
    this.saveLanguageToStorage(); // Save language when changed via language selector
  }
}
