/* =========================================
   GOAL PLUS
   MAIN JAVASCRIPT
   ========================================= */


/* =========================================
   NAVIGATION
   ========================================= */

const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(function (item) {

    item.addEventListener("click", function () {

        navItems.forEach(function (nav) {
            nav.classList.remove("active");
        });

        item.classList.add("active");

        console.log(
            "Selected:",
            item.textContent.trim()
        );

    });

});


/* =========================================
   SEARCH
   ========================================= */

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const matchCards =
    document.querySelectorAll(".match-card");


function searchMatches() {

    if (!searchInput) {
        return;
    }

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    matchCards.forEach(function (card) {

        const cardText =
            card.textContent
                .toLowerCase();


        if (
            searchText === "" ||
            cardText.includes(searchText)
        ) {

            card.style.display = "grid";

        } else {

            card.style.display = "none";

        }

    });

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        searchMatches
    );

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        searchMatches
    );

}


/* =========================================
   GLOBAL LEAGUES
   ========================================= */

const leagueCards =
    document.querySelectorAll(".league-card");


leagueCards.forEach(function (card) {

    card.addEventListener("click", function () {

        const country =
            card.querySelector("h3");

        const league =
            card.querySelector("p");


        if (country && league) {

            alert(
                country.textContent.trim() +
                " - " +
                league.textContent.trim() +
                "\n\nLeague page coming soon."
            );

        }

    });

});


/* =========================================
   MENU
   ========================================= */

const menuButton =
    document.getElementById("menuButton");


if (menuButton) {

    menuButton.addEventListener(
        "click",
        function () {

            alert(
                "Goal Plus menu is coming soon."
            );

        }
    );

}


/* =========================================
   CURRENT YEAR
   ========================================= */

const yearElement =
    document.querySelector(".creator");


if (yearElement) {

    yearElement.dataset.year =
        new Date().getFullYear();

}


/* =========================================
   READY
   ========================================= */

console.log(
    "Goal Plus is ready."
);