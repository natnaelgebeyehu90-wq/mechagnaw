// ==========================
// Dark Mode
// ==========================

const themeBtn = document.getElementById("themeBtn");

if (themeBtn) {

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        localStorage.setItem(
            "theme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );

    });

}

if (localStorage.getItem("theme") === "dark") {

    document.body.classList.add("dark");

}