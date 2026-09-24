module.exports = async function handler(request, response) {
    try {

        const apiKey = process.env.API_FOOTBALL_KEY;

        if (!apiKey) {
            return response.status(500).json({
                error: "API_FOOTBALL_KEY is missing"
            });
        }


        const requestUrl = new URL(
            request.url,
            "https://goal-plus-sable.vercel.app"
        );


        const action =
            requestUrl.searchParams.get("action");

        const date =
            requestUrl.searchParams.get("date") ||
            new Date().toISOString().slice(0, 10);

        const fixtureId =
            requestUrl.searchParams.get("fixture");

        const league =
            requestUrl.searchParams.get("league");

        const season =
            requestUrl.searchParams.get("season");

        const team =
            requestUrl.searchParams.get("team");


        let apiUrl;


        // =====================================
        // 1. MATCH EVENTS
        // =====================================

        if (fixtureId) {

            apiUrl =
                "https://v3.football.api-sports.io/fixtures/events?fixture=" +
                encodeURIComponent(fixtureId);

        }


        // =====================================
        // 2. LEAGUE STANDINGS
        // =====================================

        else if (
            action === "standings" &&
            league &&
            season
        ) {

            apiUrl =
                "https://v3.football.api-sports.io/standings?league=" +
                encodeURIComponent(league) +
                "&season=" +
                encodeURIComponent(season);

        }


        // =====================================
        // 3. LEAGUE TOP SCORERS
        // =====================================

        else if (
            action === "topscorers" &&
            league &&
            season
        ) {

            apiUrl =
                "https://v3.football.api-sports.io/players/topscorers?league=" +
                encodeURIComponent(league) +
                "&season=" +
                encodeURIComponent(season);

        }


        // =====================================
        // 4. LEAGUE TEAMS
        // =====================================

        else if (
            action === "teams" &&
            league &&
            season
        ) {

            apiUrl =
                "https://v3.football.api-sports.io/teams?league=" +
                encodeURIComponent(league) +
                "&season=" +
                encodeURIComponent(season);

        }


        // =====================================
        // 5. LEAGUE FIXTURES
        // =====================================

        else if (
            action === "league-fixtures" &&
            league &&
            season
        ) {

            apiUrl =
                "https://v3.football.api-sports.io/fixtures?league=" +
                encodeURIComponent(league) +
                "&season=" +
                encodeURIComponent(season);

        }


        // =====================================
        // 6. TEAM STATISTICS
        // =====================================

        else if (
            action === "team-statistics" &&
            team &&
            league &&
            season
        ) {

            apiUrl =
                "https://v3.football.api-sports.io/teams/statistics?team=" +
                encodeURIComponent(team) +
                "&league=" +
                encodeURIComponent(league) +
                "&season=" +
                encodeURIComponent(season);

        }


        // =====================================
        // 7. TEAM FIXTURES
        // =====================================

        else if (
            action === "team-fixtures" &&
            team &&
            season
        ) {

            apiUrl =
                "https://v3.football.api-sports.io/fixtures?team=" +
                encodeURIComponent(team) +
                "&season=" +
                encodeURIComponent(season);

        }


        // =====================================
        // 8. DEFAULT: DAILY FIXTURES
        // =====================================

        else {

            apiUrl =
                "https://v3.football.api-sports.io/fixtures?date=" +
                encodeURIComponent(date);

        }


        // =====================================
        // REQUEST API-FOOTBALL
        // =====================================

        const apiResponse = await fetch(
            apiUrl,
            {
                method: "GET",

                headers: {
                    "x-apisports-key": apiKey,
                    "Accept": "application/json"
                }
            }
        );


        const data =
            await apiResponse.json();


        // =====================================
        // RETURN RESULT
        // =====================================

        return response
            .status(apiResponse.status)
            .json(data);


    } catch (error) {

        console.error(
            "Goal Plus API error:",
            error
        );


        return response.status(500).json({
            error: "Football API request failed",
            message: error.message
        });

    }
};
