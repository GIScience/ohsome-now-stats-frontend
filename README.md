# ohsomeNow stats frontend

[![LICENSE](https://img.shields.io/github/license/GIScience/ohsome-dashboard)](LICENSE)

The **ohsomeNow stats** website offers up-to-date and global scale overview statistics on mapping activity in OpenStreetMap (OSM). 

The website allows you to get insights into the number of contributors, total map edits, added buildings and added road length for a given time range and OSM changesets hashtag filter.
You can use this website to report mapping statistics for any time range starting from 2009-04-21 when the OSM-API version 0.6 introduced changesets.

The numbers you obtain from ohsomeNow stats get updated in near-realtime.
This means that every change to OSM will be considered by the dashboard a few minutes after the edit has happened in OSM.

![ohsome-now-stats-screenshot](https://github.com/GIScience/ohsome-now-stats-frontend/assets/7045979/39cfa69b-46c5-4e0f-ab60-45facf7a810a)

The core features are:
* **Overview Statistics**: Your mapping activity statistics summarized into a single line. Currently we do report on number of contributors (green), total edits (red), buildings (purple) and km of roads (blue) for your hashtag time range.
* **Trending Hashtags Chart**: Most frequently used mapping-hashtags in your chosen time-intervals! The first entry in the lists represents the hashtag with the highest number of distinct OSM contributors. 
* **Country Map**: Number of contributions and OSM edits per country - graphically nicely displayed in form of an interactive world map.
* **Timeline Plot**: Insights about the dynamics in mapping activity over time. Define your time interval and show the effectiveness of single mapathons or long-term mapping campaigns.  

For details about the ohsomeNow stats API check [GIScience/ohsome-now-stats-service](https://github.com/GIScience/ohsome-now-stats-service).

# For Developers
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.0.
## Development server

Run `pnpm install` to install the dependencies.

Run `pnpm run dev` or `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `pnpm run build` or `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `pnpm run test` or `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

Design inspired from [Colorlib Adminator](https://github.com/puikinsh/Adminator-admin-dashboard)
