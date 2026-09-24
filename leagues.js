document.addEventListener("DOMContentLoaded", function () {

    const leagueCards =
        document.querySelectorAll(".league-card");

    leagueCards.forEach(function (card) {

        card.addEventListener("click", function () {

            const leagueId =
                card.dataset.leagueId;

            const season =
                card.dataset.season;

            const leagueName =
                card.dataset.leagueName;

            const country =
                card.dataset.country;

            openLeaguePage(
                leagueId,
                season,
                leagueName,
                country
            );

        });

    });


    function openLeaguePage(
        leagueId,
        season,
        leagueName,
        country
    ) {

        const existing =
            document.getElementById(
                "leaguePage"
            );

        if (existing) {
            existing.remove();
        }


        const page =
            document.createElement("section");

        page.id = "leaguePage";

        page.className = "section";


        page.innerHTML = `

            <div class="section-heading">

                <div>

                    <h2>
                        ${leagueName}
                    </h2>

                    <p>
                        ${country} • ${season}
                    </p>

                </div>

            </div>


            <div class="league-tabs">

                <button
                    class="league-tab active"
                    data-tab="standings"
                >
                    Standings
                </button>

                <button
                    class="league-tab"
                    data-tab="scorers"
                >
                    Top Scorers
                </button>

                <button
                    class="league-tab"
                    data-tab="teams"
                >
                    Teams
                </button>

            </div>


            <div id="leagueContent">

                <div class="empty-state">
                    Loading standings...
                </div>

            </div>


            <button
                id="closeLeague"
                class="league-back-button"
            >
                ← Back
            </button>

        `;


        document
            .querySelector("main")
            .appendChild(page);


        document
            .querySelectorAll(
                "main .section"
            )
            .forEach(function (section) {

                if (section.id !== "leaguePage") {
                    section.style.display = "none";
                }

            });


        loadStandings(
            leagueId,
            season
        );


        page.querySelectorAll(
            ".league-tab"
        ).forEach(function (tab) {

            tab.addEventListener(
                "click",
                function () {

                    page.querySelectorAll(
                        ".league-tab"
                    ).forEach(function (button) {

                        button.classList.remove(
                            "active"
                        );

                    });


                    tab.classList.add(
                        "active"
                    );


                    const type =
                        tab.dataset.tab;


                    if (type === "standings") {

                        loadStandings(
                            leagueId,
                            season
                        );

                    }


                    if (type === "scorers") {

                        loadScorers(
                            leagueId,
                            season
                        );

                    }


                    if (type === "teams") {

                        loadTeams(
                            leagueId,
                            season
                        );

                    }

                }
            );

        });


        page.querySelector(
            "#closeLeague"
        ).addEventListener(
            "click",
            function () {

                page.remove();

                document
                    .getElementById("today")
                    .style.display = "block";

            }
        );

    }


    async function loadStandings(
        leagueId,
        season
    ) {

        const content =
            document.getElementById(
                "leagueContent"
            );

        if (!content) return;


        content.innerHTML =
            `<div class="empty-state">
                Loading standings...
            </div>`;


        try {

            const response =
                await fetch(
                    "/api/football?action=standings" +
                    "&league=" +
                    leagueId +
                    "&season=" +
                    season
                );


            if (!response.ok) {
                throw new Error(
                    "Standings request failed"
                );
            }


            const data =
                await response.json();


            const standings =
                data.response?.[0]?.league?.standings?.[0] ||
                [];


            if (!standings.length) {

                content.innerHTML =
                    `<div class="empty-state">
                        No standings available.
                    </div>`;

                return;

            }


            let html = `

                <div style="overflow-x:auto">

                    <table class="league-table">

                        <thead>

                            <tr>
                                <th>#</th>
                                <th>Team</th>
                                <th>MP</th>
                                <th>W</th>
                                <th>D</th>
                                <th>L</th>
                                <th>GD</th>
                                <th>PTS</th>
                            </tr>

                        </thead>

                        <tbody>

            `;


            standings.forEach(function (row) {

                html += `

                    <tr>

                        <td>
                            ${row.rank}
                        </td>

                        <td>

                            <div style="
                                display:flex;
                                align-items:center;
                                gap:8px;
                            ">

                                <img
                                    src="${row.team.logo}"
                                    alt="${row.team.name}"
                                    style="
                                        width:28px;
                                        height:28px;
                                        object-fit:contain;
                                    "
                                >

                                <span>
                                    ${row.team.name}
                                </span>

                            </div>

                        </td>

                        <td>
                            ${row.all.played}
                        </td>

                        <td>
                            ${row.all.win}
                        </td>

                        <td>
                            ${row.all.draw}
                        </td>

                        <td>
                            ${row.all.lose}
                        </td>

                        <td>
                            ${row.goalsDiff}
                        </td>

                        <td>
                            <strong>
                                ${row.points}
                            </strong>
                        </td>

                    </tr>

                `;

            });


            html += `

                        </tbody>

                    </table>

                </div>

            `;


            content.innerHTML = html;


        } catch (error) {

            console.error(error);

            content.innerHTML =
                `<div class="empty-state">
                    Standings could not be loaded.
                </div>`;

        }

    }


    async function loadScorers(
        leagueId,
        season
    ) {

        const content =
            document.getElementById(
                "leagueContent"
            );

        if (!content) return;


        content.innerHTML =
            `<div class="empty-state">
                Loading top scorers...
            </div>`;


        try {

            const response =
                await fetch(
                    "/api/football?action=topscorers" +
                    "&league=" +
                    leagueId +
                    "&season=" +
                    season
                );


            if (!response.ok) {
                throw new Error(
                    "Top scorers request failed"
                );
            }


            const data =
                await response.json();


            const players =
                data.response || [];


            if (!players.length) {

                content.innerHTML =
                    `<div class="empty-state">
                        No top scorers available.
                    </div>`;

                return;

            }


            let html = `

                <div class="leagues-grid">

            `;


            players
                .slice(0, 20)
                .forEach(function (item) {

                    const player =
                        item.player;

                    const stats =
                        item.statistics?.[0];


                    html += `

                        <div class="league-card">

                            <img
                                src="${player.photo}"
                                alt="${player.name}"
                                style="
                                    width:70px;
                                    height:70px;
                                    border-radius:50%;
                                    object-fit:cover;
                                "
                            >

                            <h3>
                                ${player.name}
                            </h3>

                            <p>
                                ${
                                    stats?.team?.name || ""
                                }
                            </p>

                            <strong>
                                ⚽ ${
                                    stats?.goals?.total || 0
                                }
                            </strong>

                        </div>

                    `;

                });


            html += `</div>`;


            content.innerHTML = html;


        } catch (error) {

            console.error(error);

            content.innerHTML =
                `<div class="empty-state">
                    Top scorers could not be loaded.
                </div>`;

        }

    }


    async function loadTeams(
        leagueId,
        season
    ) {

        const content =
            document.getElementById(
                "leagueContent"
            );

        if (!content) return;


        content.innerHTML =
            `<div class="empty-state">
                Loading teams...
            </div>`;


        try {

            const response =
                await fetch(
                    "/api/football?action=teams" +
                    "&league=" +
                    leagueId +
                    "&season=" +
                    season
                );


            if (!response.ok) {
                throw new Error(
                    "Teams request failed"
                );
            }


            const data =
                await response.json();


            const teams =
                data.response || [];


            if (!teams.length) {

                content.innerHTML =
                    `<div class="empty-state">
                        No teams available.
                    </div>`;

                return;

            }


            let html = `

                <div class="leagues-grid">

            `;


            teams.forEach(function (item) {

                const team =
                    item.team;


                html += `

                    <div class="league-card">

                        <img
                            src="${team.logo}"
                            alt="${team.name}"
                            style="
                                width:70px;
                                height:70px;
                                object-fit:contain;
                            "
                        >

                        <h3>
                            ${team.name}
                        </h3>

                        <p>
                            ${team.country || ""}
                        </p>

                    </div>

                `;

            });


            html += `</div>`;


            content.innerHTML = html;


        } catch (error) {

            console.error(error);

            content.innerHTML =
                `<div class="empty-state">
                    Teams could not be loaded.
                </div>`;

        }

    }

});