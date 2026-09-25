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

        const action =
            url.searchParams.get("action");

        let apiUrl =
            "https://api.bigballsdata.com/v1/matches" +
            "?sport=football" +
            "&limit=200";

        if (action === "standings") {

            const league =
                url.searchParams.get("league");

            if (!league) {
                return response.status(400).json({
                    error: "League is required"
                });
            }

            apiUrl =
                "https://api.bigballsdata.com/v1/standings" +
                "?sport=football" +
                "&league=" +
                encodeURIComponent(league);
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

        return response
            .status(apiResponse.status)
            .json(data);

    } catch (error) {

        console.error(
            "Goal Plus API error:",
            error
        );

        return response.status(500).json({
            error:
                "Football API request failed",

            message:
                error.message
        });
    }
};
