import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationSearchBoxComponent } from './station-search-box.component';

describe('StationSearchBoxComponent', () => {
  let component: StationSearchBoxComponent;
  let fixture: ComponentFixture<StationSearchBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StationSearchBoxComponent]
    });
    fixture = TestBed.createComponent(StationSearchBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
