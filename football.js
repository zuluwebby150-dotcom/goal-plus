module.exports = async function handler(request, response) {
    try {
        const apiKey = process.env.API_FOOTBALL_KEY;

        if (!apiKey) {
            return response.status(500).json({
                error: "API_FOOTBALL_KEY is missing"
            });
        }

        const apiResponse = await fetch(
            "https://v3.football.api-sports.io/fixtures?live=all",
            {
                method: "GET",
                headers: {
                    "x-apisports-key": apiKey
                }
            }
        );

        const data = await apiResponse.json();

        return response.status(apiResponse.status).json(data);

    } catch (error) {
        return response.status(500).json({
            error: "Football API request failed",
            message: error.message
        });
    }
};