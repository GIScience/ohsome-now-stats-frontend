import dayjs, {Dayjs} from "dayjs";
import * as bootstrap from "bootstrap";
import {ElementRef, QueryList} from "@angular/core";
import {ApiItem, IWhosthat} from "./types";

export function over5000IntervalBins(start: string | Dayjs, end: string | Dayjs, interval: string) {
    const queryLengthInMS = dayjs(end).diff(dayjs(start))
    let intervalBins = queryLengthInMS / dayjs.duration(interval).asMilliseconds()
    return intervalBins > 5000
}

export function enableTooltips(tooltips: QueryList<ElementRef>, hideOnClick: boolean = false) {
    if (!tooltips) return
    tooltips.forEach(
        (tooltip) => {
            const bootsTip = new bootstrap.Tooltip(tooltip.nativeElement, {trigger: 'hover'})
            if (hideOnClick) {
                tooltip.nativeElement.addEventListener('click', () => {
                    bootsTip.hide()
                })
            }
        }
    )
}

export function stringifyStringArray(arr: string[]): string {
    return arr.map(str => {
        const json = JSON.stringify(str);
        return json.substring(1, json.length - 1);
    })
        .join(", ");
}

export function stringifyNamesFromResponse(data: ApiItem[]): string {
    const names: string[] = data.flatMap(item =>
        item.names.map(n => n.name)
    );

    return stringifyStringArray(names);
}