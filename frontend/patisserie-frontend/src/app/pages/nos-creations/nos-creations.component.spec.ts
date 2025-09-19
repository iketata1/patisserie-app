import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NosCreationsComponent } from './nos-creations.component';

describe('NosCreationsComponent', () => {
  let component: NosCreationsComponent;
  let fixture: ComponentFixture<NosCreationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NosCreationsComponent]
    });
    fixture = TestBed.createComponent(NosCreationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
