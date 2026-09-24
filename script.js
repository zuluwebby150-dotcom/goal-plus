document.addEventListener("DOMContentLoaded", function () {

    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll("main .section[id]");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const menuButton = document.getElementById("menuButton");

    function showSection(sectionId) {

        sections.forEach(function (section) {
            section.style.display =
                section.id === sectionId ? "block" : "none";
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

    // Navigation buttons
    navItems.forEach(function (button) {

        button.addEventListener("click", function () {

            const sectionId = this.getAttribute("data-section");

            if (sectionId) {
                showSection(sectionId);
            }

        });

    });

    // Search
    function performSearch() {

        const searchText = searchInput.value.toLowerCase().trim();
        const matchCards = document.querySelectorAll(".match-card");

        matchCards.forEach(function (card) {

            const cardText = card.textContent.toLowerCase();

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
        searchButton.addEventListener("click", performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                performSearch();
            }

        });
    }

    // League cards
    const leagueCards = document.querySelectorAll(".league-card");

    leagueCards.forEach(function (card) {

        card.addEventListener("click", function () {

            const title = card.querySelector("strong");
            const country = card.querySelector("span");

            if (title && country) {
                alert(
                    title.textContent +
                    "\n\nCountry: " +
                    country.textContent
                );
            }

        });

    });

    // Menu button
    if (menuButton) {

        menuButton.addEventListener("click", function () {

            alert(
                "Goal Plus Menu\n\n" +
                "Football\n" +
                "Leagues\n" +
                "Teams\n" +
                "News\n" +
                "Tables"
            );

        });

    }

    // Start with Today
    showSection("today");

});
