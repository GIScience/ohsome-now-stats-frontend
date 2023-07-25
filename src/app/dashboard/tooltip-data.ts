export const dashboard = {
  summary: {
    contributions: "The number of distinct users that edited OSM data within the given time range for the particular changeset comment hashtag.",
    totalEdits: "This is the number of all OSM edits to \"primary map features\" within the given time range for the particular changeset comment hashtag. Accordingly, this considers only edits for OSM elements with the tag keys defined in the OSM Wiki as Map Features.<br><br>We consider edits to all OSM types (nodes, ways, relations) and the following OSM tag keys: aerialway, aeroway, amenity, barrier, boundary, building, craft, emergency, geological, healthcare, highway, historic, landuse, leisure, man_made, military, natural, office, place, power, public_transport, railway, route, shop, sport, telecom, tourism, water, waterway.",
    buildings: "This is the number of buildings newly added to OSM within the given time range for the particular changeset comment hashtag. <br><br>Buildings are defined as all OSM ways or relations which hold the tag key building and one of the following tag values: yes, house, residential, detached, detached, garage, apartments, shed, hut, industrial.",
    kmOfRoads: "This is the length of roads in kilometers newly added to OSM and also considers the change in length when the geometry of existing roads is modified within the given time range for the particular changeset comment hashtag.<br><br>Roads are defined as all OSM ways or relations which hold the tag key highway and one of the following tag values: motorway, trunk, motorway_link, trunk_link, primary, primary_link, secondary, secondary_link, tertiary, tertiary_link, unclassified, residential.",
  },
  trendingHashtag: {
    title: "This is a list of the 10 most used changeset comment hashtags within the given time range utilizing the number of distinct OSM users as a measure to sort.",
    hashtags: "Hashtags are used in OSM as a popular way to mark changesets which belong to a particular mapping event, larger campaign or dedicated group of contributors.<br><br>The extracted hashtags are case-insensitive. This means that when you are adding #missingmaps or #MissingMaps or #missingMaps to a OSM changeset comment this will all be counted towards lower case missingmaps."
  }
}