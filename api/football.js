module.exports = async function handler(request, response) {
    try {
        const bbsKey = process.env.BBS_API_KEY;

        if (!bbsKey) {
            return response.status(500).json({
                error: "BBS_API_KEY is missing."
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
            new Date().toLocaleDateString("en-CA", {
                timeZone: "Africa/Lusaka"
            });

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
                return {
                    __error: true,
                    status: apiResponse.status,
                    data: data
                };
            }

            return data;
        }

        /*
         * ==========================================
         * LEAGUE CATALOGUE
         * ==========================================
         */
        if (action === "leagues") {
            const data = await bigBalls(
                "/v1/leagues?sport=football"
            );

            if (data.__error) {
                return response
                    .status(data.status)
                    .json(data.data);
            }

            return response.json(data);
        }

        /*
         * ==========================================
         * STANDINGS
         * ==========================================
         *
         * Big Balls:
         * /v1/standings?sport=football&league=epl
         *
         * The provider returns:
         * {
         *   data: [...]
         * }
         *
         * Goal Plus converts that into:
         * {
         *   response: [...]
         * }
         */
        if (action === "standings") {
            if (!league) {
                return response.status(400).json({
                    error: "League is required."
                });
            }

            const standings = await bigBalls(
                "/v1/standings?sport=football&league=" +
                encodeURIComponent(league)
            );

            if (standings.__error) {
                return response
                    .status(standings.status)
                    .json({
                        error:
                            standings.data?.error ||
                            "Standings request failed.",

                        details:
                            standings.data
                    });
            }

            const rows =
                Array.isArray(standings.data)
                    ? standings.data
                    : [];

            return response.json({
                response: rows,
                results: rows.length,
                meta: standings.meta || null
            });
        }

        /*
         * ==========================================
         * TOP SCORERS
         * ==========================================
         *
         * Big Balls uses hyphenated codes for
         * some league leaderboard routes:
         *
         * serie-a
         * ligue-1
         *
         * EPL, La Liga and Bundesliga work with
         * their normal codes.
         */
        if (action === "scorers") {
            if (!league) {
                return response.status(400).json({
                    error: "League is required."
                });
            }

            let scorerLeague = league;

            if (league === "seriea") {
                scorerLeague = "serie-a";
            }

            if (league === "ligue1") {
                scorerLeague = "ligue-1";
            }

            const scorers = await bigBalls(
                "/v1/leagues/" +
                encodeURIComponent(scorerLeague) +
                "/top-scorers"
            );

            if (scorers.__error) {
                return response
                    .status(scorers.status)
                    .json({
                        error:
                            scorers.data?.error ||
                            "Top scorers request failed.",

                        details:
                            scorers.data
                    });
            }

            const rows =
                Array.isArray(scorers.data)
                    ? scorers.data
                    : [];

            return response.json({
                response: rows,
                results: rows.length,
                meta: scorers.meta || null
            });
        }

        /*
         * ==========================================
         * MATCH EVENTS
         * ==========================================
         */
        if (fixture) {
            const events = await bigBalls(
                "/v1/matches/" +
                encodeURIComponent(fixture) +
                "/events?sport=football"
            );

            if (events.__error) {
                return response
                    .status(events.status)
                    .json(events.data);
            }

            return response.json(events);
        }

        /*
         * ==========================================
         * LIVE MATCHES
         * ==========================================
         */
        if (action === "live") {
            const live = await bigBalls(
                "/v1/matches?sport=football&status=live&limit=200"
            );

            if (live.__error) {
                return response
                    .status(live.status)
                    .json(live.data);
            }

            const matches =
                Array.isArray(live.data)
                    ? live.data
                    : [];

            const normalized =
                matches.map(normalizeMatch);

            return response.json({
                response: normalized,
                results: normalized.length,
                meta: live.meta || null
            });
        }

        /*
         * ==========================================
         * MATCHES BY DATE
         * ==========================================
         */
        const data = await bigBalls(
            "/v1/matches?sport=football&limit=200"
        );

        if (data.__error) {
            return response
                .status(data.status)
                .json(data.data);
        }

        const matches =
            Array.isArray(data.data)
                ? data.data
                : [];

        const normalized =
            matches
                .filter(function (match) {
                    if (!match.kickoff_utc) {
                        return false;
                    }

                    const localDate =
                        new Date(
                            match.kickoff_utc
                        ).toLocaleDateString(
                            "en-CA",
                            {
                                timeZone:
                                    "Africa/Lusaka"
                            }
                        );

                    return (
                        localDate ===
                        requestedDate
                    );
                })
                .map(normalizeMatch);

        return response.json({
            response: normalized,
            results: normalized.length,
            meta: data.meta || null
        });

    } catch (error) {
        console.error(
            "Goal Plus API error:",
            error
        );

        return response.status(500).json({
            error:
                "Football data request failed.",

            message:
                error.message
        });
    }
};


/*
 * ==========================================
 * NORMALIZE BIG BALLS MATCH
 * ==========================================
 */
function normalizeMatch(match) {

    const status =
        String(
            match.status || "scheduled"
        ).toLowerCase();

    let shortStatus = "NS";
    let longStatus = "Not Started";
    let elapsed = null;

    if (
        status === "live" ||
        status === "in_progress"
    ) {
        shortStatus = "2H";
        longStatus = "Match Live";

        if (
            match.clock &&
            typeof match.clock.minute ===
                "number"
        ) {
            elapsed =
                match.clock.minute;
        }
    }

    else if (
        status === "halftime"
    ) {
        shortStatus = "HT";
        longStatus = "Half Time";
    }

    else if (
        status === "final" ||
        status === "completed"
    ) {
        shortStatus = "FT";
        longStatus = "Full Time";
    }

    else if (
        status === "postponed"
    ) {
        shortStatus = "PST";
        longStatus = "Postponed";
    }

    const homeScore =
        match.score?.home ??
        null;

    const awayScore =
        match.score?.away ??
        null;

    return {
        fixture: {
            id:
                match.id,

            date:
                match.kickoff_utc,

            venue: {
                name:
                    match.venue?.name ||
                    ""
            },

            status: {
                long:
                    longStatus,

                short:
                    shortStatus,

                elapsed:
                    elapsed
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
                    match.home?.id ||
                    "",

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
                    match.away?.id ||
                    "",

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
            home:
                homeScore,

            away:
                awayScore
        },

        score: {
            halftime: {
                home: null,
                away: null
            },

            fulltime: {
                home:
                    homeScore,

                away:
                    awayScore
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
 * ==========================================
 * CLEAN LOGO URL
 * ==========================================
 */
function cleanLogo(logo) {
    if (!logo) {
        return "";
    }

    const value =
        String(logo);

    const markdownMatch =
        value.match(
            /\((https?:\/\/[^)]+)\)/
        );

    if (markdownMatch) {
        return markdownMatch[1];
    }

    return value;
                }
