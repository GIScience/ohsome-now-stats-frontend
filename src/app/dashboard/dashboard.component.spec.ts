import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DashboardComponent} from './dashboard.component';
import {Component} from "@angular/core";
import {StateService} from "../state.service";
import {of} from "rxjs";

// Mock child components
@Component({
    selector: 'default-query',
    template: '<div></div>'
})
class MockQueryComponent {
}

@Component({
    selector: 'app-trending-hashtags',
    template: '<div></div>'
})
class MockTrendingHashtagsComponent {
}

@Component({
    selector: 'app-export-data',
    template: '<div></div>'
})
class MockExportDataComponent {
}

@Component({
    selector: 'app-summary',
    template: '<div></div>'
})
class MockSummaryComponent {
}

@Component({
    selector: 'app-plot',
    template: '<div></div>'
})
class MockPlotComponent {
}

@Component({
    selector: 'app-map',
    template: '<div></div>'
})
class MockMapComponent {
}

@Component({
    selector: 'app-hex-map',
    template: '<div></div>'
})
class MockHexMapComponent {
}

@Component({
    selector: 'app-country-map',
    template: '<div></div>'
})
class MockCountryMapComponent {
}

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MockQueryComponent,
                MockTrendingHashtagsComponent,
                MockExportDataComponent,
                MockSummaryComponent,
                MockPlotComponent,
                MockMapComponent,
                MockHexMapComponent,
                MockCountryMapComponent,
                DashboardComponent
            ],
            providers: [{provide: StateService, useValue: {activePage: of(null)}}]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});