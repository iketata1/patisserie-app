import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoStripComponent } from './reco-strip.component';

describe('RecoStripComponent', () => {
  let component: RecoStripComponent;
  let fixture: ComponentFixture<RecoStripComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecoStripComponent]
    });
    fixture = TestBed.createComponent(RecoStripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
