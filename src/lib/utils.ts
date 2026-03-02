import dayjs, {Dayjs} from "dayjs";
import * as bootstrap from "bootstrap";
import {ElementRef, QueryList} from "@angular/core";
import {ApiItem} from "./types";

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

export function stringifyNamesFromResponse(data: ApiItem[]): string {
    if (data.length == 0) return ""

    return data[0].names.flatMap(
        n => n.name
    ).join(", ")
}