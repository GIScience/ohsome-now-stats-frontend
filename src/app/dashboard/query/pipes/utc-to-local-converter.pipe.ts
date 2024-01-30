import { Pipe, PipeTransform } from '@angular/core';
import dayjs from "dayjs";
// @ts-ignore

@Pipe({
  name: 'UTCToLocalConverter',
  standalone: false
})
export class UTCToLocalConverterPipe implements PipeTransform {

  transform(dateToFormat: Date | string, ...args: unknown[]): string {
    if (typeof dateToFormat === "string"){
      dateToFormat = dayjs(dateToFormat).add(dayjs().utcOffset(),"minute").toDate()
    }
    try {
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
        .format(dateToFormat)
    } catch (e) {
      return "Data not available";
    }
  }
}

export function UTCStringToLocalDateConverterFunction(date: string): Date{
  return dayjs(date).add(dayjs().utcOffset(),"minute").toDate()
}
