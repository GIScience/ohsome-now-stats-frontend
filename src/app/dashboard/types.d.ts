import dayjs from "dayjs";

export type StatsType =
    'users'
    | 'edits'
    | 'buildings'
    | 'roads'
    | 'amenity'
    | 'body_of_water'
    | 'commercial'
    | 'education'
    | 'financial'
    | 'healthcare'
    | 'lulc'
    | 'place'
    | 'poi'
    | 'social_facility'
    | 'wash'
    | 'waterway';

export type TopicName =
    'amenity'
    | 'body_of_water'
    | 'commercial'
    | 'education'
    | 'financial'
    | 'healthcare'
    | 'lulc'
    | 'place'
    | 'poi'
    | 'social_facility'
    | 'wash'
    | 'waterway'

export interface TopicValues {
    hashtag: string
    topic: string
    value: number
}

export type TopicResponse = Record<TopicName, TopicValues>

export interface IWrappedTopicData {
    // result: Map<string, ITopicData>
    result: TopicResponse
}

export interface TopicDefinitionValue {
    id: string
    name: string
    "color-hex": string
    "color-light": string
    "y-title": string
    dropdown_name?: string
    tooltip?: string
    icon?: string
    value?: string
}

export type TopicDefinition = Record<StatsType, TopicDefinitionValue>

export interface IWrappedSummaryData {
    result: ISummaryData
}

export interface ISummaryData {
    changesets?: number
    users: number
    edits: number
    buildings: number
    roads: number
    latest?: string
    hashtag?: string
    countries?: string
    startDate?: string
    endDate?: string
}

export interface IQueryData {
    start: string
    end: string
    hashtag: string
    interval: string
    countries: string
    topics: string
}

export interface IWrappedPlotData {
    result: IPlotData
}

export interface IPlotData {
    changesets?: number[]
    users: number[]
    roads: number[]
    buildings: number[]
    edits: number[]
    latest?: string
    hashtag?: string | string[]
    startDate: string[]
    endDate: string[]
    countries?: string | string[]
}


export interface IWrappedTopicPlotData {
    result: Record<string, ITopicPlotData>
}

export interface ITopicPlotData {
    value: number[]
    topic: string
    startDate: string[]
    endDate: string[]
}

export interface IWrappedTopicCountryData {
    query: { timespan: { startDate: string, endDate: string }, hashtag: string }
    result: Record<StatsType, ITopicCountryData[]>
}

export interface ITopicCountryData {
    topic: string
    country: string
    value: number
}


/**
 * Response JSON returned by /stats/{hashtag}/country endoint
 */
export interface IWrappedCountryStatsData {
    query: { timespan: { startDate: string, endDate: string }, hashtag: string }
    result: ICountryStatsData[]
}

export interface ICountryStatsData {
    users: number
    roads: number
    buildings: number
    edits: number
    'amenity'?: number
    'body_of_water'?: number
    'commercial'?: number
    'education'?: number
    'financial'?: number
    'healthcare'?: number
    'lulc'?: number
    'place'?: number
    'poi'?: number
    'social_facility'?: number
    'wash'?: number
    'waterway'?: number
    latest: string
    country: string
}

export interface IQueryParam {
    countries: string
    hashtag: string
    start: string // date in ISO format, ensure to keep milliseconds as 0
    end: string // date in ISO format, ensure to keep milliseconds as 0
    interval: string // eg:'P1D' default value: 'P1M'
    topics: string
    fit_to_content?: string
}

export interface IHashtag {
    hashtagTitle: string
    hashtag: string
    number_of_users: number
    tooltip: string
    percent: number
}

export interface IMetaData {
    start: string // date in ISO format, ensure to keep milliseconds as 0
    end: string // date in ISO format, ensure to keep milliseconds as 0
}

interface IHashtags {
    hashtag: string
    count: number
}


interface IHighlightedHashtag {
    hashtag: string
    highlighted: string
}

interface IDateRange {
    end: dayjs.Dayjs
    start: dayjs.Dayjs
}

export interface ICountryStatsDataAsArrays {
    country: string[],
    users: number[],
    roads: number[],
    buildings: number[],
    'amenity': number[],
    'body_of_water': number[]
    'commercial': number[],
    'education': number[],
    'financial': number[],
    'healthcare': number[],
    'lulc': number[],
    'place': number[],
    'poi': number[],
    'social_facility': number[],
    'wash': number[],
    'waterway': number[],
    edits: number[],
    latest: string[]
}