import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DefaultDashboardComponent} from './default-dashboard.component';
import {Component, ChangeDetectionStrategy} from "@angular/core";
import {StateService} from "../../../../lib/state.service";
import {of} from "rxjs";

@Component({selector: 'default-query', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockDefaultQueryComponent {}

@Component({selector: 'hot-query', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockHotQueryComponent {}

@Component({selector: 'live-query', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockLiveQueryComponent {}

@Component({selector: 'app-trending-hashtags', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockTrendingHashtagsComponent {}

@Component({selector: 'app-export-data', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockExportDataComponent {}

@Component({selector: 'app-summary', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockSummaryComponent {}

@Component({selector: 'app-plot', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockPlotComponent {}

@Component({selector: 'app-map', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockMapComponent {}

@Component({selector: 'app-hex-map', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockHexMapComponent {}

@Component({selector: 'app-country-map', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true})
class MockCountryMapComponent {}

describe('DashboardComponent', () => {
    let component: DefaultDashboardComponent;
    let fixture: ComponentFixture<DefaultDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DefaultDashboardComponent],
            providers: [{provide: StateService, useValue: {activePage: of('dashboard')}}]
        })
        .overrideComponent(DefaultDashboardComponent, {
            set: {
                imports: [
                    MockDefaultQueryComponent,
                    MockHotQueryComponent,
                    MockLiveQueryComponent,
                    MockTrendingHashtagsComponent,
                    MockExportDataComponent,
                    MockSummaryComponent,
                    MockPlotComponent,
                    MockMapComponent,
                    MockHexMapComponent,
                    MockCountryMapComponent
                ]
            }
        })
        .compileComponents();

        fixture = TestBed.createComponent(DefaultDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
