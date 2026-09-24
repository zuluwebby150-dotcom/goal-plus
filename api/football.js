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

        const date =
            requestUrl.searchParams.get("date") ||
            new Date().toISOString().slice(0, 10);

        const apiResponse = await fetch(
            "https://v3.football.api-sports.io/fixtures?date=" +
            encodeURIComponent(date),
            {
                method: "GET",
                headers: {
                    "x-apisports-key": apiKey,
                    "Accept": "application/json"
                }
            }
        );

        const data = await apiResponse.json();

        return response
            .status(apiResponse.status)
            .json(data);

    } catch (error) {
        return response.status(500).json({
            error: "Football API request failed",
            message: error.message
        });
    }
};
