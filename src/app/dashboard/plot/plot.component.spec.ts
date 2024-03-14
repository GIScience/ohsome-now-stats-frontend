import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PlotComponent} from './plot.component';
import {Overlay} from "../../overlay.component";
import {UTCToLocalConverterPipe} from "../query/pipes/utc-to-local-converter.pipe";
import dayjs from "dayjs";

describe('PlotComponent', () => {
    let component: PlotComponent;
    let fixture: ComponentFixture<PlotComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlotComponent, Overlay, UTCToLocalConverterPipe],
            providers: [{
                provide: UTCToLocalConverterPipe
            }]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PlotComponent);
        component = fixture.componentInstance;
        component.data = {
            startDate: ["2008-01-01T00:00Z", "2009-01-01T00:00Z", "2010-01-01T00:00Z"],
            endDate: ["2009-01-01T00:00Z", "20010-01-01T00:00Z", "2011-01-01T00:00Z"],
            users: [],
            roads: [],
            buildings: [],
            edits: []
        }
        component.selectedDateRange = {start: dayjs("2008-05-01T00:00Z"), end: dayjs("2010-05-01T00:00Z")}
        component.currentStats = "users"
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    describe('stripedOrNot', () => {
        it('returns not striped for middle of an array', () => {
            expect(component.stripedOrNot(1)).toBe('')
        })

        it('returns striped if first date is not fully contained in query', () => {
            expect(component.stripedOrNot(0)).toBe('/')
        })

        it('returns striped if last date is not fully contained in query', () => {
            expect(component.stripedOrNot(2)).toBe('/')
        })

        it('returns not striped if first date is fully contained in query', () => {
            component.selectedDateRange.start = dayjs("2007-05-01T00:00Z")
            expect(component.stripedOrNot(0)).toBe('')
        })

        it('returns not striped if last date is fully contained in query', () => {
            component.selectedDateRange.end = dayjs("2012-05-01T00:00Z")
            expect(component.stripedOrNot(2)).toBe('')
        })
    })
});
