import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'UTCToLocalConverter',
  standalone: false
})
export class UTCToLocalConverterPipe implements PipeTransform {

  transform(dateToFromat: Date, ...args: unknown[]): string {
    try {
      let date = new Date(dateToFromat.toString());
      return new Intl.DateTimeFormat('de-DE', {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeZoneName: "short"
      })
        .format(date)
    } catch (e) {
      return "Data not available";
    }
  }
}
