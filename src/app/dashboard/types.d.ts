import dayjs from "dayjs";

export type StatsType =
    'contributor'
    | 'edit'
    | 'building'
    | 'road'
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


export interface ITopicDefinitionValue extends IStatsData {
    id: string
    name: string
    "color-hex": string
    "color-light": string
    "y-title": string
    dropdown_name: string
    tooltip: string
    icon: string
}


interface IModifiedSection {
    count_modified: number,
    unit_more?: number,
    unit_less?: number,
}

export interface IStatsData {
    value: number
    deleted?: number
    added?: number
    modified?: IModifiedSection
}


export interface IStatsResult {
    topics: Record<StatsType, IStatsData>
}

export interface IWrappedStatsResult {
    result: IStatsResult
}

export interface IWrappedPlotResult {
    result: IPlotResult
}

export interface IPlotResult {
    startDate: string[],
    endDate: string[],
    topics: Record<StatsType, IPlotData>
}

export interface IPlotData {
    value: number[]
    deleted?: number[]
    added?: number[]
    modified?: IModifiedArraySection
}

interface IModifiedArraySection {
    count_modified: number[],
    unit_more?: number[],
    unit_less?: number[],
}

export interface IWrappedCountryResult {
    result: ICountryResult
}

export interface ICountryResult {
    topics: Record<StatsType, ICountryData[]>
}

export interface ICountryData extends IStatsData {
    country: string
}

export interface ICountryLocationData extends ICountryData{
    lonLat: [number, number]
}

export interface ICountryDataAsArrays {
    countries: string[]
    values: number[]
}


export interface IQueryParams {
    start: string
    end: string
    hashtag: string
    interval: string
    countries: string
    topics: string
}

export interface IStateParams extends IQueryParams {
    fit_to_content?: string
    active_topic: StatsType
}

export interface IHashtag {
    hashtagTitle?: string
    hashtag: string
    number_of_users: number
    tooltip?: string
    percent?: number
}

export interface IMetaData {
    min_timestamp: string // date in ISO format, ensure to keep milliseconds as 0
    max_timestamp: string // date in ISO format, ensure to keep milliseconds as 0
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

export interface IBaseResponse {
    attribution: IAttribution,
    query: IQuery,
    metadata: {
        executionTime: number,
        requestUrl: string
    },
}

interface IQuery {
    timespan: { startDate: string, endDate: string },
    hashtag: string
}

interface IAttribution {
    url: string;
    text?: string;
}

export interface IMetadataResponse extends IBaseResponse {
    result: IMetaData
}

export interface ITrendingHashtagResponse extends IBaseResponse {
    result: Array<IHashtag>
}

export interface HexDataType {
    result: number;
    hex_cell: string;
}
