/**
 * Represents a single stop on the tour.
 * 
 * Date, city, and venue are in all caps. The links are in all lowercase.
 * 
 * @param {string} date - The date, in the format MMM, DD
 * @param {string} city - The city, in the format CITY, ST
 * @param {string} venue - The full name of the venue or `"TO BE ANNOUNCED"`
 * @param {string|null} info - Link to the tour info page or `null`
 */
class TourDate {
	constructor(date, city, venue, info) {
		this.date = date;
		this.city = city;
		this.venue = venue;
		this.info = info;
	}
}

module.exports = TourDate;
