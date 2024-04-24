import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {RouterTestingModule} from '@angular/router/testing';
import {NgxDaterangepickerMd} from 'ngx-daterangepicker-material';

import {of} from 'rxjs';
import {QueryComponent} from './query.component';
import {DataService} from 'src/app/data.service';
import {ToastService} from 'src/app/toast.service';
import {SelectDropDownModule} from 'ngx-select-dropdown'
import {UTCToLocalConverterPipe} from './pipes/utc-to-local-converter.pipe';
import dayjs from 'dayjs';
import {AutoCompleteModule} from "primeng/autocomplete";

describe('QueryComponent', () => {
    let component: QueryComponent;
    let fixture: ComponentFixture<QueryComponent>;

    // Create a mock DataService with the necessary methods
    const dataServiceMock = {
        getMetaData: jasmine.createSpy('getMetaData').and.returnValue(of({
            start: '2009-04-21T20:02:04Z',
            end: '2023-08-02T10:21:31Z'
        })),
        requestAllHashtags: jasmine.createSpy('requestAllHashtags').and.returnValue(of(['missingmaps', 'hotosm-project-1'])),
    };


    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QueryComponent, UTCToLocalConverterPipe,],
            imports: [
                RouterTestingModule,
                FormsModule,
                NgxDaterangepickerMd.forRoot(),
                SelectDropDownModule,
                AutoCompleteModule
            ],
            providers: [
                {provide: DataService, useValue: dataServiceMock},
                {provide: ToastService, useValue: {}},
                {provide: UTCToLocalConverterPipe}
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QueryComponent);
        component = fixture.componentInstance;
        component.maxDate = dayjs("2021-01-01T00:00:00Z");
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('cleanHashTags', () => {
        it('should return empty string for empty input', () => {
            const input = {hashtag: '', highlighted: ''};
            const expectedOutput = '';
            expect(component.cleanHashTag(input)).toEqual(expectedOutput);
        });


        it('should handle input string with single hashtag', () => {
            const input = {hashtag: '#hashtag', highlighted: ''};
            const expectedOutput = 'hashtag';
            expect(component.cleanHashTag(input)).toEqual(expectedOutput);
        });

        it('should handle only string not object input', () => {
            const input = '#hashtag';

            const expectedOutput = 'hashtag';
            expect(component.cleanHashTag(input)).toEqual(expectedOutput);
        })
    });

});

