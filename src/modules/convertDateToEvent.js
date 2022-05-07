/* cspell:word Bardavon */

const TourDate = require("./TourDate.js"); // eslint-disable-line no-unused-vars -- Used only in documentation.
const { calendar_v3 } = require("googleapis"); // eslint-disable-line no-unused-vars -- Used only in documentation.

/**
 * Converts a TourDate object from the website to be used in Google Calendar.
 * 
 * @param   {TourDate} date Data for a tour stop from the website
 * @returns {calendar_v3.Params$Resource$Events$Insert}
 *          The data formatted for uploading to Google Calendar
 */
function convertDateToEvent(date) {

	/** 
	 *  {
	 *    "date": "APRIL 26",
	 *    "city": "POUGHKEEPSIE, NY",
	 *    "venue": "BARDAVON OPERA HOUSE",
	 *    "info": "https://www.bardavon.org/show/weird-al-yankovic-w-special-guest-emo-philips/"
	 *  }
	 */

	date.city = toTitleCase(date.city.substr(0, date.city.indexOf(",")))
	            + date.city.substring(date.city.indexOf(","));
	date.venue = toTitleCase(date.venue);
	date.date = new Date(date.date + " 2022").toISOString().substring(0, 10); // Convert to ISO String and remove time
	if (!date.info) {
		// If there is no info link, set the description to a placeholder
		date.info = "Ticket link coming soon";
		console.warn("Tickets for the show on " + date.date + " in " + date.city
		             + " at " + date.venue + ", are not yet released.");
	}

	/** 
	 *  {
	 *    "date": "2021-04-26",
	 *    "city": "Poughkeepsie, NY",
	 *    "venue": "Bardavon Opera House",
	 *    "info": "https://www.bardavon.org/show/weird-al-yankovic-w-special-guest-emo-philips/"
	 *  }
	 */

	return {
		summary: date.city,
		location: date.venue + ", " + date.city,
		description: date.info,
		start: {
			date: date.date,
		},
		end: {
			date: date.date,
		}
	};

	/**
	 *  {
	 *    "summary": "Poughkeepsie, NY",
	 *    "location": "Bardavon Opera House, Poughkeepsie, NY",
	 *    "description": "https://www.bardavon.org/show/weird-al-yankovic-w-special-guest-emo-philips/",
	 *    "start": { "date": "2021-04-26" },
	 *    "end": { "date": "2021-04-26" }
	 *  }
	 */
}

/**
 * Converts a string to Title Case.
 * 
 * Matches all words in the given string, and capitalizes the first letter.
 * Alphanumeric and underscore characters count as words, any other characters
 * make a new word.
 * 
 * @param {string} str The string to convert
 * @returns {string} The String In Title Case
 */
function toTitleCase(str) {
	return str.replace(/\w+/gu, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

module.exports = { convertDateToEvent, toTitleCase };
