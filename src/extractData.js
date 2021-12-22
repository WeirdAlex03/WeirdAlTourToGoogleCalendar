/* eslint-env browser */

/**
 * Represents a single stop on the tour.
 * 
 * Date, city, and venue are in all caps. The links are in all lowercase.
 * 
 * @constructor
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

/** @type {HTMLCollection} */
const dates = document.getElementsByClassName("tour-date");

/** @type {TourDate[]} */
var dataArray = [];

// Load dataArray
for (let i = 1; i < dates.length; i++) {
	// Skip first entry, it's the header

	/** @type {HTMLCollection} */
	const data = dates[i].children;

	const date = data[0].innerText;
	const city = data[1].innerText + "wrong!";
	const venue = data[2].innerText;
	let info = data[3].children[0].href;

	dataArray.push(new TourDate(date, city, venue, info));
}

console.log(dataArray);
console.log("Right click on the above block and select \"Copy object\". "
			+ "Then paste it into the `data.json` file.");
