/* globals test, expect, describe */
/* cspell:word Bardavon */

const { convertDateToEvent, toTitleCase } = require("../src/modules/convertDateToEvent.js");

describe("convertDateToEvent", () => {
	test("Normal entry", () => {
		const input = {
			date: "APRIL 26",
			city: "POUGHKEEPSIE, NY",
			venue: "BARDAVON OPERA HOUSE",
			info: "https://www.bardavon.org/show/weird-al-yankovic-w-special-guest-emo-philips/"
		};
		const expected = {
			summary: "Poughkeepsie, NY",
			location: "Bardavon Opera House, Poughkeepsie, NY",
			description: "https://www.bardavon.org/show/weird-al-yankovic-w-special-guest-emo-philips/",
			start: { date: "2022-04-26" },
			end: { date: "2022-04-26" }
		};

		expect(convertDateToEvent(input)).toEqual(expected);
	});

	test("No info link", () => {
		const input = {
			date: "JUNE 12",
			city: "RENO, NV",
			venue: "SILVER LEGACY RESORT & CASINO - RENO BALLROOM",
			info: null
		};
		const expected = {
			summary: "Reno, NV",
			location: "Silver Legacy Resort & Casino - Reno Ballroom, Reno, NV",
			description: "Ticket link coming soon",
			start: { date: "2022-06-12" },
			end: { date: "2022-06-12" }
		};

		expect(convertDateToEvent(input)).toEqual(expected);
	});

	test("\"New\" badge", () => {
		const input = {
			date: "NEW\nJULY 30",
			city: "OTTAWA, ON",
			venue: "TO BE ANNOUNCED",
			info: "https://nac-cna.ca/en/event/30099"
		};
		const expected = {
			summary: "Ottawa, ON",
			location: "To Be Announced, Ottawa, ON",
			description: "https://nac-cna.ca/en/event/30099",
			start: { date: "2022-07-30" },
			end: { date: "2022-07-30" }
		};

		expect(convertDateToEvent(input)).toEqual(expected);
	});
});

describe("toTitleCase", () => {
	test("ALL CAPS", () => {
		expect(toTitleCase("ALL CAPS")).toBe("All Caps");
	});

	test("lower case", () => {
		expect(toTitleCase("lower case")).toBe("Lower Case");
	});

	test("Sentence Case", () => {
		expect(toTitleCase("Sentence Case")).toBe("Sentence Case");
	});
});
