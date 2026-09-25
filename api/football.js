module.exports = async function handler(request, response) {
    try {
        const apiKey = process.env.BBS_API_KEY;

        if (!apiKey) {
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
        const season = url.searchParams.get("season");
        const date =
            url.searchParams.get("date") ||
            new Date().toISOString().slice(0, 10);

        /*
         * Goal Plus league IDs -> Big Balls league codes
         */
        const leagueMap = {
            "39": "epl",
            "140": "laliga",
            "135": "seriea",
            "78": "bundesliga",
            "61": "ligue1",
            "71": "brasileirao"
        };

        const bbsLeague =
            leagueMap[league] || league;

        let apiUrl;

        /*
         * CURRENT STANDINGS
         */
        if (
            action === "standings" &&
            bbsLeague
        ) {
            apiUrl =
                "https://api.bigballsdata.com/v1/standings" +
                "?sport=football" +
                "&league=" +
                encodeURIComponent(bbsLeague);
        }

        /*
         * TOP SCORERS
         */
        else if (
            action === "topscorers" &&
            bbsLeague
        ) {
            apiUrl =
                "https://api.bigballsdata.com/v1/leagues/" +
                encodeURIComponent(
                    bbsLeague === "seriea"
                        ? "serie-a"
                        : bbsLeague === "ligue1"
                            ? "ligue-1"
                            : bbsLeague
                ) +
                "/top-scorers" +
                (
                    season
                        ? "?season=" +
                          encodeURIComponent(season)
                        : ""
                );
        }

        /*
         * TODAY'S / CURRENT FOOTBALL
         */
        else {
            apiUrl =
                "https://api.bigballsdata.com/v1/matches" +
                "?sport=football" +
                "&limit=200";
        }

        const apiResponse = await fetch(
            apiUrl,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Bearer " + apiKey,
                    "Accept":
                        "application/json"
                }
            }
        );

        const data =
            await apiResponse.json();

        if (!apiResponse.ok) {
            return response
                .status(apiResponse.status)
                .json(data);
        }

        /*
         * Convert Big Balls matches into the
         * structure Goal Plus already understands.
         */
        if (!action && Array.isArray(data.data)) {

            const matches = data.data
                .filter(function (match) {

                    if (!match.kickoff_utc) {
                        return false;
                    }

                    const matchDate =
                        new Date(
                            match.kickoff_utc
                        )
                        .toISOString()
                        .slice(0, 10);

                    return matchDate === date;

                })
                .map(function (match) {

                    const status =
                        match.status || "scheduled";

                    let short = "NS";
                    let long = "Not Started";
                    let elapsed = null;

                    if (
                        status === "live"
                    ) {
                        short = "2H";
                        long = "Match Live";

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
                        status === "final"
                    ) {
                        short = "FT";
                        long = "Match Finished";
                    }

                    else if (
                        status === "scheduled"
                    ) {
                        short = "NS";
                        long = "Not Started";
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
                                    null
                            },

                            status: {
                                long,
                                short,
                                elapsed
                            }
                        },

                        league: {
                            id:
                                match.league?.id ||
                                null,

                            name:
                                match.league?.name ||
                                "Football",

                            country:
                                match.league?.country ||
                                ""
                        },

                        teams: {

                            home: {
                                id:
                                    match.home?.id ||
                                    null,

                                name:
                                    match.home?.name ||
                                    "Home",

                                logo:
                                    match.home?.logo_url ||
                                    ""
                            },

                            away: {
                                id:
                                    match.away?.id ||
                                    null,

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

                });

            return response.json({
                response: matches,
                results: matches.length
            });
        }

        /*
         * Standings / scorers are returned to
         * the frontend for the next integration step.
         */
        return response.json(data);

    } catch (error) {

        console.error(
            "Goal Plus BBS error:",
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
