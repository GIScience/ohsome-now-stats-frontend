import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ToastComponent } from './toast/toast.component';
import { SummaryComponent } from './dashboard/summary/summary.component';
import { QueryComponent } from './dashboard/query/query.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TrendingHashtagsComponent } from './dashboard/trending-hashtags/trending-hashtags.component';
import { DataService } from './data.service';
import { BigNumberComponent } from './dashboard/summary/big-number/big-number.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        SummaryComponent,
        QueryComponent,
        DashboardComponent,
        TrendingHashtagsComponent,
        ToastComponent,
        BigNumberComponent
      ],
      providers: [
        DataService
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Dashboard - ohsomeNow Stats'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Dashboard - ohsomeNow Stats');
  });
  
});
