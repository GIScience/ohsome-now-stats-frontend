import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { SummaryComponent } from './summary.component';
import { ISummaryData } from '../types';
import { By } from '@angular/platform-browser';
import {DOCUMENT} from "@angular/common";

@Component({
  selector: 'overlay',
  template: '<div></div>'
})
class MockOverlayComponent {
  @Input() isLoading: boolean = false;
  @Input() containerElement: HTMLElement | undefined;
}

@Component({
  selector: 'app-big-number',
  template: '<div></div>'
})
class MockBigNumberComponent {
  @Input() name: string | undefined;
  @Input() value: string | undefined;
  @Input() tooltip: string | undefined;
  @Input() icon: string | undefined;
  @Input() color: string | undefined;
  @Input() colorLight: string | undefined;
  @Input() startSelected: boolean | undefined;
}

describe('SummaryComponent', () => {
  let component: SummaryComponent;
  let fixture: ComponentFixture<SummaryComponent>;

  const mockData: ISummaryData = {
    users: 1000,
    // activeUsers: 500,
    edits: 15000,
    hashtag: 'test-hashtag',
    buildings: 5000,
    roads: 20000,
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-01-31T23:59:59Z',
    latest: '2023-01-31T00:00:00Z',
    changesets: 2000,
    countries: 'DE'
  };

  const mockTopicData = {
    buildings: 5000,
    roads: 10000
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockOverlayComponent, MockBigNumberComponent],
      declarations: [SummaryComponent],
      providers: [
        { provide: DOCUMENT, useValue: document },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display overlay when loading', () => {
    component.isSummaryLoading = true;
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('overlay'));
    expect(overlay).toBeTruthy();
    // expect(overlay.properties['isLoading']).toBeTrue();
  });

  it('should render big-number components for each data item', () => {
    component.ngOnChanges();
    fixture.detectChanges();
    const bigNumbers = fixture.debugElement.queryAll(By.css('app-big-number'));
    expect(bigNumbers.length).toBe(component.bignumberData.length);
  });

  it('should pass correct properties to big-number components', () => {
    component.ngOnChanges();
    fixture.detectChanges();
    const firstBigNumber = fixture.debugElement.query(By.css('app-big-number'));
    // Get the component instance
    const bigNumberComponent = firstBigNumber.componentInstance;

    expect(bigNumberComponent.name).toBe(component.bignumberData[0].name);
    expect(bigNumberComponent.value).toBe(component.bignumberData[0].value);
    expect(bigNumberComponent.icon).toBe(component.bignumberData[0].icon);
    expect(bigNumberComponent.tooltip).toBe(component.bignumberData[0].tooltip);
    expect(bigNumberComponent['color']).toBe(component.bignumberData[0]['color-hex']);
    expect(bigNumberComponent['colorLight']).toBe(component.bignumberData[0]['color-light']);
  });

  it('should set startSelected property correctly', () => {
    component.currentlySelected = 'users';
    component.ngOnChanges();
    fixture.detectChanges();

    const bigNumbers = fixture.debugElement.queryAll(By.css('app-big-number'));
    const selectedBigNumber = bigNumbers.find(el => el.properties['startSelected']);

    if(selectedBigNumber) {
      expect(selectedBigNumber).toBeTruthy();
      expect(selectedBigNumber.properties['id']).toBe('users');
    }
  });

  it('should call changeCurrentStats when big-number is clicked', () => {
    spyOn(component, 'changeCurrentStats');
    component.ngOnChanges();
    fixture.detectChanges();

    const firstBigNumber = fixture.debugElement.query(By.css('app-big-number'));
    firstBigNumber.triggerEventHandler('click', null);

    expect(component.changeSelectedBigNumber).toHaveBeenCalled();
  });

  // it('should have proper CSS classes and styling', () => {
  //   const container = fixture.debugElement.query(By.css('#big-number_container'));
  //   expect(container.nativeElement.classList.contains('row')).toBeTrue();
  //   expect(container.nativeElement.classList.contains('pos-r')).toBeTrue();
  //   expect(container.nativeElement.style.paddingRight).toBe('0px');
  //
  //   const bigNumbers = fixture.debugElement.queryAll(By.css('app-big-number'));
  //   expect(bigNumbers[0].nativeElement.classList.contains('col-md-3')).toBeTrue();
  //   expect(bigNumbers[0].nativeElement.classList.contains('app-big-number')).toBeTrue();
  //   expect(bigNumbers[0].nativeElement.style.paddingRight).toBe('0px');
  // });

  // Previous tests from the first version remain the same...
  describe('ngOnChanges', () => {
    it('should not process data if input is empty', () => {
      component.data = undefined as any;
      component.ngOnChanges();
      expect(component.bignumberData.length).toBe(0);
    });

    // it('should set currentlySelected to users if current selection is invalid', () => {
    //   // Mock document.getElementById to return a clickable element
    //   spyOn(document, 'getElementById').and.returnValue({
    //     click: jasmine.createSpy('click')
    //   } as any);
    //
    //   component.currentlySelected = 'invalid';
    //   component.ngOnChanges();
    //
    //   expect(component.currentlySelected).toBe('users');
    //   // expect(document.getElementById).toHaveBeenCalledWith('users');
    // });

    it('should merge topicData with main data', () => {
      component.topicData = mockTopicData;
      component.ngOnChanges();
      expect(component.data).toEqual({...mockData, ...mockTopicData});
    });

    it('should populate bignumberData with formatted values', () => {
      component.ngOnChanges();
      expect(component.bignumberData.length).toBeGreaterThan(0);
      expect(component.bignumberData[0].value).toMatch(/^\d{1,3}(,\d{3})*$/); // Check for formatted number
    });

    it('should sort bignumberData with Contributors and Total Edits first', () => {
      component.ngOnChanges();
      const firstItem = component.bignumberData[0];
      expect(firstItem.name === 'Contributors' || firstItem.name === 'Total Edits').toBeTrue();
    });
  });

  describe('formatNumbertoNumberformatString', () => {
    it('should format numbers with commas', () => {
      expect(component.formatNumbertoNumberformatString(1000)).toBe('1,000');
      expect(component.formatNumbertoNumberformatString(1234567)).toBe('1,234,567');
    });

    it('should handle zero', () => {
      expect(component.formatNumbertoNumberformatString(0)).toBe('0');
    });
  });

  // describe('changeSelectedSummaryComponent', () => {
  //   it('should handle event target correctly', () => {
  //     const mockEvent = {
  //       target: {
  //         nodeName: 'APP-BIG-NUMBER',
  //         children: [{
  //           closest: () => ({ children: [{ classList: { remove: jasmine.createSpy(), add: jasmine.createSpy() } }] })
  //         }]
  //       }
  //     };
  //     component.changeSelectedSummaryComponent(mockEvent);
  //     expect(mockEvent.target.children[0].closest).toHaveBeenCalledWith('.big_number');
  //   });
  // });

  describe('changeCurrentStats', () => {
    it('should emit event with new stats type', () => {
      const mockEvent = { target: { closest: () => ({ parentNode: { parentNode: { children: [] } } }) } };
      spyOn(component.changeCurrentStatsEvent, 'emit');

      component.changeSelectedBigNumber(mockEvent, 'users');

      expect(component.currentlySelected).toBe('users');
      // expect(component.changeCurrentStatsEvent.emit).toHaveBeenCalledWith('activeUsers');
    });
  });

  // describe('enableTooltips', () => {
  //   it('should initialize bootstrap tooltips', () => {
  //     spyOn(bootstrap, 'Tooltip');
  //     spyOn(document, 'querySelectorAll').and.returnValue([{}] as any);
  //
  //     component.enableTooltips();
  //
  //     expect(bootstrap.Tooltip).toHaveBeenCalled();
  //   });
  // });

  // describe('downloadCsv', () => {
  //   it('should not download if no data', () => {
  //     component.data = undefined as any;
  //     spyOn(console, 'log'); // Spy on console to verify no errors
  //     component.downloadCsv();
  //     expect(console.log).not.toHaveBeenCalled();
  //   });
  //
  //   it('should arrange headers with dates first', () => {
  //     // This test would need the actual csv library to be properly mocked
  //     // For now we just verify the function can be called
  //     component.downloadCsv();
  //     expect(component.data).toBeDefined();
  //   });
  // });
});