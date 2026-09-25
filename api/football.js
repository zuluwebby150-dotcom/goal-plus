module.exports = async function handler(request, response) {
    try {
        const key = process.env.BBS_API_KEY;

        if (!key) {
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
        const date = url.searchParams.get("date");
        const fixture = url.searchParams.get("fixture");

        async function callAPI(endpoint) {
            const result = await fetch(
                "https://api.bigballsdata.com" + endpoint,
                {
                    headers: {
                        "Authorization": "Bearer " + key,
                        "Accept": "application/json"
                    }
                }
            );

            const data = await result.json();

            return response
                .status(result.status)
                .json(data);
        }

        /* CURRENT STANDINGS */
        if (action === "standings") {

            if (!league) {
                return response.status(400).json({
                    error: "Missing league code"
                });
            }

            return callAPI(
                "/v1/standings?sport=football&league=" +
                encodeURIComponent(league)
            );
        }

        /* LEAGUE LIST */
        if (action === "leagues") {
            return callAPI(
                "/v1/leagues?sport=football"
            );
        }

        /* LIVE MATCHES */
        if (action === "live") {
            return callAPI(
                "/v1/matches?sport=football&status=live&limit=200"
            );
        }

        /* MATCH EVENTS */
        if (fixture) {
            return callAPI(
                "/v1/matches/" +
                encodeURIComponent(fixture) +
                "/events?sport=football"
            );
        }

        /* MATCHES BY DATE */
        if (!action) {

            const result = await fetch(
                "https://api.bigballsdata.com/v1/matches?sport=football&limit=200",
                {
                    headers: {
                        "Authorization": "Bearer " + key,
                        "Accept": "application/json"
                    }
                }
            );

            const data = await result.json();

            if (!Array.isArray(data.data)) {
                return response
                    .status(result.status)
                    .json(data);
            }

            const requestedDate =
                date ||
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const matches =
                data.data.filter(function(match) {

                    if (!match.kickoff_utc) {
                        return false;
                    }

                    const localDate =
                        new Date(match.kickoff_utc)
                            .toLocaleDateString(
                                "en-CA",
                                {
                                    timeZone:
                                        "Africa/Lusaka"
                                }
                            );

                    return localDate === requestedDate;
                });

            return response.json({
                response: matches.map(normalizeMatch),
                results: matches.length
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
            error:
                "Football data request failed",
            message:
                error.message
        });
    }
};


function normalizeMatch(match) {

    let shortStatus = "NS";
    let longStatus = "Not Started";
    let elapsed = null;

    const status =
        String(match.status || "")
            .toLowerCase();

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
            elapsed =
                match.clock.minute;
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
                    match.home?.logo_url ||
                    ""
            },

            away: {
                id:
                    match.away?.id || "",

                name:
                    match.away?.name ||
                    "Away",

                logo:
                    match.away?.logo_url ||
                    ""
            }
        },

        goals: {
            home:
                match.score?.home ?? null,

            away:
                match.score?.away ?? null
        },

        score: {
            halftime: {
                home: null,
                away: null
            },

            fulltime: {
                home:
                    match.score?.home ?? null,

                away:
                    match.score?.away ?? null
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
