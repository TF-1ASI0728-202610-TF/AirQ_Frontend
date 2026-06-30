import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionDetailComponent } from './subscription-detail.component';

describe('SubscriptionDetail', () => {
  let component: SubscriptionDetailComponent;
  let fixture: ComponentFixture<SubscriptionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
