import dayjs, {Dayjs} from "dayjs";

export function over5000IntervalBins(start: string | Dayjs, end: string | Dayjs, interval: string) {
    const queryLengthInMS = dayjs(end).diff(dayjs(start))
    let intervalBins = queryLengthInMS / dayjs.duration(interval).asMilliseconds()
    return intervalBins > 5000
}
