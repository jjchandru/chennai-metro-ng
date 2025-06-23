import { NgModule } from '@angular/core';
import { BrowserModule, Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StationSearchBoxComponent } from './station-search-box/station-search-box.component';
import { SearchComponent } from './search/search.component';
import { JourneyComponent } from './journey/journey.component';

@NgModule({
  declarations: [
    AppComponent,
    StationSearchBoxComponent,
    SearchComponent,
    JourneyComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    Meta,
    Title
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
