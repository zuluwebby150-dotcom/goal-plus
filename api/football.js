module.exports = async function handler(request, response) {
    try {
        const bbsKey = process.env.BBS_API_KEY;

        if (!bbsKey) {
            return response.status(500).json({
                error: "BBS_API_KEY is missing"
            });
        }

        const url = new URL(
            request.url,
            "https://goal-plus-sable.vercel.app"
        );

        const action = url.searchParams.get("action");
        const league = url.searchParams.get("league");
        const fixture = url.searchParams.get("fixture");

        const requestedDate =
            url.searchParams.get("date") ||
            new Date().toISOString().slice(0, 10);

        async function bigBalls(path) {
            const apiResponse = await fetch(
                "https://api.bigballsdata.com" + path,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + bbsKey,
                        "Accept": "application/json"
                    }
                }
            );

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Big Balls API error"
                );
            }

            return data;
        }

        /*
         * LIVE MATCHES
         */
        if (action === "live") {
            const data = await bigBalls(
                "/v1/matches?sport=football&status=live&limit=200"
            );

            const matches = Array.isArray(data.data)
                ? data.data
                : [];

            const normalized = matches.map(normalizeMatch);

            return response.json({
                response: normalized,
                results: normalized.length
            });
        }

        /*
         * MATCH EVENTS
         */
        if (fixture) {
            const data = await bigBalls(
                "/v1/matches/" +
                encodeURIComponent(fixture) +
                "/events?sport=football"
            );

            return response.json(data);
        }

        /*
         * STANDINGS
         */
        if (action === "standings") {
            if (!league) {
                return response.status(400).json({
                    error: "League is required."
                });
            }

            const data = await bigBalls(
                "/v1/standings?sport=football&league=" +
                encodeURIComponent(league)
            );

            return response.json(data);
        }

        /*
         * LEAGUES
         */
        if (action === "leagues") {
            const data = await bigBalls(
                "/v1/leagues?sport=football"
            );

            return response.json(data);
        }

        /*
         * TODAY / DATE MATCHES
         */
        if (!action) {
            const data = await bigBalls(
                "/v1/matches?sport=football&limit=200"
            );

            const matches = Array.isArray(data.data)
                ? data.data
                : [];

            const normalized = matches
                .filter(function (match) {
                    if (!match.kickoff_utc) {
                        return false;
                    }

                    const localDate =
                        new Date(match.kickoff_utc)
                            .toLocaleDateString(
                                "en-CA",
                                {
                                    timeZone: "Africa/Lusaka"
                                }
                            );

                    return localDate === requestedDate;
                })
                .map(normalizeMatch);

            return response.json({
                response: normalized,
                results: normalized.length
            });
        }

        return response.json({
            response: [],
            results: 0
        });

    } catch (error) {
        console.error(
            "Goal Plus API error:",
            error
        );

        return response.status(500).json({
            error: "Football data request failed",
            message: error.message
        });
    }
};


/*
 * Convert Big Balls match data
 * into the format Goal Plus already understands.
 */
function normalizeMatch(match) {

    const status =
        String(match.status || "")
            .toLowerCase();

    let shortStatus = "NS";
    let longStatus = "Not Started";
    let elapsed = null;

    if (
        status === "live" ||
        status === "in_progress"
    ) {
        shortStatus = "LIVE";
        longStatus = "Match Live";

        if (
            match.clock &&
            typeof match.clock.minute === "number"
        ) {
            elapsed = match.clock.minute;
        }
    }

    else if (
        status === "halftime" ||
        status === "half_time"
    ) {
        shortStatus = "HT";
        longStatus = "Half Time";
    }

    else if (
        status === "final" ||
        status === "completed" ||
        status === "finished"
    ) {
        shortStatus = "FT";
        longStatus = "Full Time";
    }

    else if (status === "postponed") {
        shortStatus = "PST";
        longStatus = "Postponed";
    }

    else if (status === "cancelled") {
        shortStatus = "CANC";
        longStatus = "Cancelled";
    }

    const homeScore =
        match.score?.home ?? null;

    const awayScore =
        match.score?.away ?? null;

    return {
        fixture: {
            id: match.id,

            date: match.kickoff_utc,

            venue: {
                name:
                    match.venue?.name || ""
            },

            status: {
                long: longStatus,
                short: shortStatus,
                elapsed: elapsed
            }
        },

        league: {
            id:
                match.league?.id ||
                match.league ||
                "",

            name:
                match.league?.name ||
                match.league ||
                "Football",

            country:
                match.league?.country ||
                ""
        },

        teams: {
            home: {
                id:
                    match.home?.id || "",

                name:
                    match.home?.name ||
                    "Home",

                logo:
                    cleanLogo(
                        match.home?.logo_url
                    )
            },

            away: {
                id:
                    match.away?.id || "",

                name:
                    match.away?.name ||
                    "Away",

                logo:
                    cleanLogo(
                        match.away?.logo_url
                    )
            }
        },

        goals: {
            home: homeScore,
            away: awayScore
        },

        score: {
            halftime: {
                home: null,
                away: null
            },

            fulltime: {
                home: homeScore,
                away: awayScore
            },

            extratime: {
                home: null,
                away: null
            },

            penalty: {
                home: null,
                away: null
            }
        }
    };
}


/*
 * Clean logo URLs.
 */
function cleanLogo(logo) {
    if (!logo) {
        return "";
    }

    const value = String(logo);

    const markdownMatch =
        value.match(
            /\((https?:\/\/[^)]+)\)/
        );

    if (markdownMatch) {
        return markdownMatch[1];
    }

    return value;
          }
