document.addEventListener("DOMContentLoaded", function () {

    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll("main .section[id]");

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const menuButton = document.getElementById("menuButton");

    const todayMatches =
        document.querySelector("#today .matches-grid");

    const liveMatches =
        document.getElementById("liveMatches");

    const resultsMatches =
        document.getElementById("resultsMatches");

    const fixtureMatches =
        document.getElementById("fixtureMatches");


    /* =========================
       SECTION NAVIGATION
    ========================= */

    function showSection(sectionId) {

        sections.forEach(function (section) {

            if (section.id === sectionId) {
                section.style.display = "block";
            } else {
                section.style.display = "none";
            }

        });

        navItems.forEach(function (button) {

            if (button.dataset.section === sectionId) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }

        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    navItems.forEach(function (button) {

        button.addEventListener("click", function () {

            const sectionId =
                this.getAttribute("data-section");

            if (sectionId) {
                showSection(sectionId);
            }

        });

    });


    /* =========================
       SEARCH
    ========================= */

    function performSearch() {

        const searchText =
            searchInput.value.toLowerCase().trim();

        const matchCards =
            document.querySelectorAll(".match-card");

        matchCards.forEach(function (card) {

            const cardText =
                card.textContent.toLowerCase();

            if (
                searchText === "" ||
                cardText.includes(searchText)
            ) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }

        });

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    performSearch();
                }

            }
        );

    }


    /* =========================
       CREATE MATCH CARD
    ========================= */

    function createMatchCard(match) {

        const fixture = match.fixture || {};
        const teams = match.teams || {};
        const league = match.league || {};
        const goals = match.goals || {};

        const homeTeam =
            teams.home?.name || "Home Team";

        const awayTeam =
            teams.away?.name || "Away Team";

        const homeLogo =
            teams.home?.logo || "";

        const awayLogo =
            teams.away?.logo || "";

        const leagueName =
            league.name || "Football";

        const country =
            league.country || "";

        const status =
            fixture.status?.short || "";

        let matchStatus = "Scheduled";

        if (
            status === "LIVE" ||
            status === "1H" ||
            status === "2H" ||
            status === "HT" ||
            status === "ET" ||
            status === "P"
        ) {
            matchStatus = "LIVE";
        }

        if (
            status === "FT" ||
            status === "AET" ||
            status === "PEN"
        ) {
            matchStatus = "Finished";
        }

        let scoreText = "vs";

        if (
            goals.home !== null &&
            goals.home !== undefined &&
            goals.away !== null &&
            goals.away !== undefined
        ) {
            scoreText =
                goals.home + " - " + goals.away;
        }

        let timeText = "";

        if (fixture.date) {

            const matchDate =
                new Date(fixture.date);

            timeText =
                matchDate.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }


        const card =
            document.createElement("div");

        card.className = "match-card";


        card.innerHTML = `
            <div class="competition">
                ${leagueName}
                ${country ? " • " + country : ""}
            </div>

            <div class="match-teams">

                <div class="team">
                    ${
                        homeLogo
                        ? `<img class="team-logo"
                                src="${homeLogo}"
                                alt="${homeTeam}">`
                        : ""
                    }

                    <strong>${homeTeam}</strong>
                </div>

                <div class="score">

                    <span class="score-time">
                        ${timeText}
                    </span>

                    <strong>
                        ${scoreText}
                    </strong>

                </div>

                <div class="team">

                    ${
                        awayLogo
                        ? `<img class="team-logo"
                                src="${awayLogo}"
                                alt="${awayTeam}">`
                        : ""
                    }

                    <strong>${awayTeam}</strong>

                </div>

            </div>

            <div class="match-status">
                ${matchStatus}
            </div>
        `;

        return card;
    }


    /* =========================
       EMPTY MESSAGE
    ========================= */

    function showLoading(container) {

        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <h3>Loading matches...</h3>
                <p>Getting today's football fixtures.</p>
            </div>
        `;

    }


    function showError(container) {

        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <h3>Matches unavailable</h3>
                <p>
                    We couldn't load the football data right now.
                    Please try again later.
                </p>
            </div>
        `;

    }


    /* =========================
       LOAD TODAY'S MATCHES
    ========================= */

    async function loadMatches() {

        showLoading(todayMatches);
        showLoading(liveMatches);

        try {

            const now = new Date();

            const year =
                now.getFullYear();

            const month =
                String(
                    now.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    now.getDate()
                ).padStart(2, "0");

            const date =
                year + "-" + month + "-" + day;


            const response =
                await fetch(
                    "/api/football?date=" + date
                );


            if (!response.ok) {
                throw new Error(
                    "Football API error: " +
                    response.status
                );
            }


            const data =
                await response.json();


            if (
                !data ||
                !Array.isArray(data.response)
            ) {
                throw new Error(
                    "Invalid football data"
                );
            }


            const matches =
                data.response;


            /* TODAY */

            if (todayMatches) {

                todayMatches.innerHTML = "";

                if (matches.length === 0) {

                    todayMatches.innerHTML = `
                        <div class="empty-state">
                            <h3>No matches found</h3>
                            <p>
                                There are no fixtures available
                                for today.
                            </p>
                        </div>
                    `;

                } else {

                    matches.forEach(function (match) {

                        todayMatches.appendChild(
                            createMatchCard(match)
                        );

                    });

                }

            }


            /* LIVE */

            const liveGames =
                matches.filter(function (match) {

                    const status =
                        match.fixture?.status?.short;

                    return [
                        "LIVE",
                        "1H",
                        "2H",
                        "HT",
                        "ET",
                        "P"
                    ].includes(status);

                });


            if (liveMatches) {

                liveMatches.innerHTML = "";

                if (liveGames.length === 0) {

                    liveMatches.innerHTML = `
                        <div class="empty-state">
                            <h3>No live matches</h3>
                            <p>
                                There are no live matches
                                right now.
                            </p>
                        </div>
                    `;

                } else {

                    liveGames.forEach(function (match) {

                        liveMatches.appendChild(
                            createMatchCard(match)
                        );

                    });

                }

            }


            /* RESULTS */

            if (resultsMatches) {

                resultsMatches.innerHTML = "";

                const finished =
                    matches.filter(function (match) {

                        const status =
                            match.fixture?.status?.short;

                        return [
                            "FT",
                            "AET",
                            "PEN"
                        ].includes(status);

                    });


                if (finished.length === 0) {

                    resultsMatches.innerHTML = `
                        <div class="empty-state">
                            <h3>No completed matches</h3>
                            <p>
                                Completed matches will appear here.
                            </p>
                        </div>
                    `;

                } else {

                    finished.forEach(function (match) {

                        resultsMatches.appendChild(
                            createMatchCard(match)
                        );

                    });

                }

            }


            /* FIXTURES */

            if (fixtureMatches) {

                fixtureMatches.innerHTML = "";

                const upcoming =
                    matches.filter(function (match) {

                        const status =
                            match.fixture?.status?.short;

                        return ![
                            "FT",
                            "AET",
                            "PEN",
                            "LIVE",
                            "1H",
                            "2H",
                            "HT",
                            "ET",
                            "P"
                        ].includes(status);

                    });


                if (upcoming.length === 0) {

                    fixtureMatches.innerHTML = `
                        <div class="empty-state">
                            <h3>No upcoming fixtures</h3>
                            <p>
                                Upcoming matches will appear here.
                            </p>
                        </div>
                    `;

                } else {

                    upcoming.forEach(function (match) {

                        fixtureMatches.appendChild(
                            createMatchCard(match)
                        );

                    });

                }

            }

        } catch (error) {

            console.error(
                "Goal Plus:",
                error
            );

            showError(todayMatches);
            showError(liveMatches);

            if (resultsMatches) {
                showError(resultsMatches);
            }

            if (fixtureMatches) {
                showError(fixtureMatches);
            }

        }

    }


    /* =========================
       LEAGUE BUTTONS
    ========================= */

    const leagueCards =
        document.querySelectorAll(".league-card");

    leagueCards.forEach(function (card) {

        card.addEventListener(
            "click",
            function () {

                const title =
                    card.querySelector("strong");

                const country =
                    card.querySelector(
                        "span:last-child"
                    );

                if (title && country) {

                    alert(
                        title.textContent +
                        "\n\nCountry: " +
                        country.textContent
                    );

                }

            }
        );

    });


    /* =========================
       MENU
    ========================= */

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function () {

                alert(
                    "GOAL PLUS\n\n" +
                    "Global Football\n" +
                    "Live Scores\n" +
                    "Results\n" +
                    "Fixtures\n" +
                    "League Tables\n" +
                    "Football News"
                );

            }
        );

    }


    /* =========================
       START WEBSITE
    ========================= */

    showSection("today");

    loadMatches();

});