const language = document.getElementById("language");

const translations = {

    EN: {

        home: "Home",
        faq: "FAQ",
        about: "About",

        heroTitle: "Download YouTube Videos",
        heroSubtitle: "Paste a YouTube link below to download it as MP4 or MP3."

    },

    AM: {

        home: "መነሻ",
        faq: "ጥያቄዎች",
        about: "ስለ እኛ",

        heroTitle: "የዩቲዩብ ቪዲዮዎችን ያውርዱ",
        heroSubtitle: "የYouTube ሊንክ ያስገቡ እና MP4 ወይም MP3 ያውርዱ።"

    }

};

function applyLanguage(lang){

    const t = translations[lang];

    if(document.getElementById("navHome"))
        document.getElementById("navHome").textContent = t.home;

    if(document.getElementById("navFAQ"))
        document.getElementById("navFAQ").textContent = t.faq;

    if(document.getElementById("navAbout"))
        document.getElementById("navAbout").textContent = t.about;

    if(document.getElementById("heroTitle"))
        document.getElementById("heroTitle").textContent = t.heroTitle;

    if(document.getElementById("heroSubtitle"))
        document.getElementById("heroSubtitle").textContent = t.heroSubtitle;

    localStorage.setItem("language", lang);

}

if(language){

    const saved = localStorage.getItem("language") || "EN";

    language.value = saved;

    applyLanguage(saved);

    language.addEventListener("change", () => {

        applyLanguage(language.value);

    });

}