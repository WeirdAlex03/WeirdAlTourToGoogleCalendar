const { readFile, writeFile } = require("fs");
const { createInterface } = require("readline");
const { google, calendar_v3 } = require("googleapis");
const { convertDateToEvent } = require("./modules/convertDateToEvent.js");
const TourDate = require("./modules/TourDate.js"); // eslint-disable-line no-unused-vars -- Used only in documentation.


/**
 * Calendar ID for the calendar to events to.
 * 
 * You can find it in Calendar settings > Integrate calendar.
 * It will either be your email or end in `@group.calendar.google.com`.
 */
const CALENDAR_ID = "EXAMPLE@group.calendar.google.com";


/*
 * ------------ You do not need to modify anything below this line. ------------
 *
 * Make sure data.json is filled in from the website and that you
 * have set up your API key and credentials. Follow the steps in the README.
 * Then, run the program with `node .` or the run button in your IDE.
 */


/**
 * Path to the data extracted from the website with `extractData.js`.
 * 
 * Follow the steps in the README to fill in this file.
 */
const DATA_PATH = "./src/data.json";

/**
 * Path to the credentials for this application.
 * 
 * Follow the steps in the README to generate this.
 */
const CREDENTIALS_PATH = "private/credentials.json";

/**
 * Path to the file storing the access token.
 * 
 * This file will automatically be created when you first run the program.
 */
const TOKEN_PATH = "private/token.json";

/**
 * Array of scopes this needs access to
 * 
 * If modifying these scopes, delete `token.json`
 */
const SCOPES = ["https://www.googleapis.com/auth/calendar"];


/* eslint-disable -- This section is just copied in from Google Calendar API docs*/

// Load client secrets from a local file.
readFile(CREDENTIALS_PATH, (err, content) => {
	if (err) return console.log("Error loading client secret file:", err);
	// Authorize a client with credentials, then call the Google Calendar API.
	authorize(JSON.parse(content), buildEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	readFile(TOKEN_PATH, (err, token) => {
		if (err) return getAccessToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	});
	console.log("Authorize this app by visiting this url:", authUrl);
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question("Enter the code from that page here: ", (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error("Error retrieving access token", err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log("Token stored to", TOKEN_PATH);
			});
			callback(oAuth2Client);
		});
	});
}

/* eslint-enable -- Start of my code */


/**
 * Builds an array of calendar events from the tour dates.
 * 
 * Reads the tour dates from `data.json` (type `TourDate[]`) and passes an
 * array of Google Calendar events to `addEvents()`.
 * 
 * Uses `convertDateToEvent` to make the calendar events.
 * 
 * @param {google.auth.OAuth2} auth - The OAuth2 client to create events with.
 */
function buildEvents(auth) {
	/** @type {Array<TourDate>} */
	let dates;

	/** @type {Array<calendar_v3.Params$Resource$Events$Insert>} */
	const events = [];

	readFile(DATA_PATH, (err, data) => {
		if (err) {
			console.error("Error reading data.json: ", err);
			return;
		}

		dates = JSON.parse(data);

		for (const date of dates) {
			events.push(convertDateToEvent(date));
		}

		addEvents(auth, events);
	});

}

/**
 * Passthrough function for `addEvent()`.
 * 
 * Feeds the array of events in one at a time.
 * 
 * @param {google.auth.OAuth2} auth - The OAuth2 client to create events with.
 * @param {Array<calendar_v3.Params$Resource$Events$Insert>} events 
 *        Array of calendar events ready for use with `calendar.events.insert`
 */
function addEvents(auth, events) {
	const calendar = google.calendar({ version: "v3", auth: auth });

	calendar.events.list({
		auth: auth,
		calendarId: CALENDAR_ID,
	}).then((res) => {
		for (const event of events) {
			addEvent(auth, event, res.data.items);
		}
	}).catch((err) => {
		console.error("Error getting existing events: " + err.code + ": " + err.message);
		console.error("No events will be added.");
	});
}

/**
 * Uploads a calendar event to Google Calendar.
 * 
 * Uses exponential backoff to retry if the request gets rate limited
 * with up to 1 minute between retries and 10 total attempts. The event will
 * be printed to the console if it fails.
 * 
 * @param {google.auth.OAuth2} auth - The OAuth2 client to create events with.
 * @param {calendar_v3.Params$Resource$Events$Insert} event -
 *        Single calendar event ready for use with `calendar.events.insert`
 * @param {Array<calendar_v3.Schema$Event>} existingEvents -
 *        Array of existing events in the calendar
 * @param {int} [timeouts=0] - Number of times the request got rate limited
 * 
 * @todo - Does not handle changed dates or cancelled shows. The calendar can
 *         have other events so they can't just be deleted. Maybe print a
 *         warning to the console for events within the earliest and latest
 *         shows, plus a few days in either direction, for manual review?
 * 
 * @todo - KNOWN ISSUE: Some events existing events are not properly recognized.
 *         This appears to be deterministic, but it's not clear why. Events with
 *         new/sold out tags and without are both affected. More investigation
 *         is needed.
 */
function addEvent(auth, event, existingEvents, timeouts = 0) {
	if (timeouts > 10) {
		// Give up after 10 attempts
		console.error("Too many timeouts, giving up on event: ", event);
		return;
	}

	const MAX_BACKOFF = (60 * 1000) - (Math.random() * 1000); // 1 minute, ish

	const calendar = google.calendar({ version: "v3", auth: auth });

	const currentEvent = existingEvents.find((existingEvent) => (
		existingEvent.start.date === event.start.date));

	if (currentEvent) {
		// Compare the event to the existing event
		if (
			currentEvent.summary !== event.summary
			|| currentEvent.description !== event.description
			|| currentEvent.location !== event.location
		) {
			// If the event is different, update it
			calendar.events.update({
				auth: auth,
				calendarId: CALENDAR_ID,
				eventId: currentEvent.id,
				resource: event,
			}, (err) => {
				if (err) {
					if (err.message === "Rate Limit Exceeded") {
						setTimeout(() => {
							addEvent(auth, event, existingEvents, timeouts + 1);
						}, Math.min((((2 ** timeouts) * 1000) + (Math.random() * 1000)), MAX_BACKOFF));
						// 2^n seconds + random ms, up to 1 minute, see https://cloud.google.com/storage/docs/retry-strategy#exponential-backoff
					} else {
						console.error("There was an error uploading an event: " + err.code
							+ ": " + err.message + "\n" + event);
					}
				}
			});
		}
	} else {
		// If the event doesn't exist, create it
		calendar.events.insert({
			auth: auth,
			calendarId: CALENDAR_ID,
			resource: event,
		}, (err) => {
			if (err) {
				if (err.message === "Rate Limit Exceeded") {
					setTimeout(() => {
						addEvent(auth, event, existingEvents, timeouts + 1);
					}, Math.min((((2 ** timeouts) * 1000) + (Math.random() * 1000)), MAX_BACKOFF));
					// 2^n seconds + random ms, up to 1 minute, see https://cloud.google.com/storage/docs/retry-strategy#exponential-backoff
				} else {
					console.error("There was an error uploading an event: " + err.code
						+ ": " + err.message + "\n" + event);
				}
			}
		});
	}
}
