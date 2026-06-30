import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionDashboardComponent } from './prediction-dashboard.component';

describe('PredictionDashboardComponent', () => {
  let component: PredictionDashboardComponent;
  let fixture: ComponentFixture<PredictionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PredictionDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
