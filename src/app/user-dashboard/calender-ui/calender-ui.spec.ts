import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalenderUI } from './calender-ui';

describe('CalenderUI', () => {
  let component: CalenderUI;
  let fixture: ComponentFixture<CalenderUI>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalenderUI]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalenderUI);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
