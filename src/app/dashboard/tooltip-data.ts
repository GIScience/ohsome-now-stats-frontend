export const dashboard = {
  summary: {
    contributions: "The number of distinct users that edited OSM data for the hashtag and the time range defined in your query.",
    totalEdits: "The number of all OSM edits to "primary map features" for the hashtag and the time range defined in your query.",
    buildings: "The absolute increase or decrease in the amount of buildings in the OSM database induced by mapping activity for the hashtag and the time range defined in your query.",
    kmOfRoads: "The absolute increase or decrease in the road network length in kilometers in the OSM database induced by mapping activity for the hashtag and the time range defined in your query.",
  },
  trendingHashtag: {
    title: "The trending hashtags leaderboard lists the 10 most used changeset comment hashtags for the time range defined in your query. The first entry in the lists represents the hashtag with the highest number of distinct OSM contributors.",
    hashtags: "Hashtags are used in OSM as a popular way to mark changesets which belong to a particular mapping event, larger campaign or dedicated group of contributors.<br><br>The extracted hashtags are case-insensitive. This means that when you are adding #missingmaps or #MissingMaps or #missingMaps to a OSM changeset comment this will all be counted towards lower case missingmaps."
  }
}
