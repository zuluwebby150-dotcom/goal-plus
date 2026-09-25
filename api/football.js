  module.exports = async function handler(request, response) {
    try {
        const bbsKey = process.env.BBS_API_KEY;
        const oldKey = process.env.API_FOOTBALL_KEY;

        if (!bbsKey && !oldKey) {
            return response.status(500).json({
                error: "No football API key is configured."
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

        /*
         * --------------------------------------------------
         * BIG BALLS DATA
         * --------------------------------------------------
         */

        async function bigBalls(path) {

            const apiResponse = await fetch(
                "https://api.bigballsdata.com" + path,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            "Bearer " + bbsKey,
                        "Accept":
                            "application/json"
                    }
                }
            );

            const data =
                await apiResponse.json();

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
         * --------------------------------------------------
         * CURRENT FOOTBALL MATCHES
         * --------------------------------------------------
         */

        if (!action && !fixture) {

            const data = await bigBalls(
                "/v1/matches?sport=football&limit=200"
            );

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
                            )
                            .toLocaleDateString(
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
                    .map(function (match) {

                        const status =
                            match.status ||
                            "scheduled";

                        let shortStatus = "NS";
                        let longStatus =
                            "Not Started";

                        let elapsed = null;

                        if (
                            status === "live" ||
                            status === "in_progress"
                        ) {

                            shortStatus = "2H";
                            longStatus =
                                "Match Live";

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
                            longStatus =
                                "Half Time";
                        }

                        else if (
                            status === "final" ||
                            status === "completed"
                        ) {

                            shortStatus = "FT";
                            longStatus =
                                "Full Time";
                        }

                        else if (
                            status === "postponed"
                        ) {

                            shortStatus = "PST";
                            longStatus =
                                "Postponed";
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
                    });

            return response.json({
                response:
                    normalized,

                results:
                    normalized.length
            });
        }

        /*
         * --------------------------------------------------
         * MATCH EVENTS
         * --------------------------------------------------
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
         * --------------------------------------------------
         * CURRENT STANDINGS
         * --------------------------------------------------
         */

        if (
            action === "standings"
        ) {

            if (!league) {
                return response.status(400).json({
                    error:
                        "League is required."
                });
            }

            const data = await bigBalls(
                "/v1/standings" +
                "?sport=football" +
                "&league=" +
                encodeURIComponent(league)
            );

            return response.json(data);
        }

        /*
         * --------------------------------------------------
         * LEAGUE LIST
         * --------------------------------------------------
         */

        if (
            action === "leagues"
        ) {

            const data = await bigBalls(
                "/v1/leagues?sport=football"
            );

            return response.json(data);
        }

        /*
         * --------------------------------------------------
         * FALLBACK TO OLD API-FOOTBALL
         * --------------------------------------------------
         */

        if (oldKey) {

            let apiUrl =
                "https://v3.football.api-sports.io/fixtures?date=" +
                encodeURIComponent(
                    requestedDate
                );

            if (fixture) {

                apiUrl =
                    "https://v3.football.api-sports.io/fixtures/events?fixture=" +
                    encodeURIComponent(
                        fixture
                    );
            }

            const oldResponse =
                await fetch(
                    apiUrl,
                    {
                        headers: {
                            "x-apisports-key":
                                oldKey,

                            "Accept":
                                "application/json"
                        }
                    }
                );

            const oldData =
                await oldResponse.json();

            return response
                .status(oldResponse.status)
                .json(oldData);
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


/*
 * Big Balls sometimes returns a complete
 * markdown-style URL. Extract the actual URL.
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
