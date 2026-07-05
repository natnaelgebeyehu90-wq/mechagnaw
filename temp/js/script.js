const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const qualities = document.getElementById("qualities");
const loader = document.getElementById("loader");
const button = document.getElementById("downloadBtn");
const message = document.getElementById("message");
const input = document.getElementById("urlInput");
const pasteBtn = document.getElementById("pasteBtn");

pasteBtn.addEventListener("click", async () => {

    try{

        const text = await navigator.clipboard.readText();

        input.value = text;

        input.focus();

    }catch{

        alert("Clipboard access was denied.");

    }

});

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        button.click();

    }

});

const socket = io();


button.addEventListener("click", async () => {

    document.getElementById("videoCard").classList.add("hidden");
    message.textContent = "";

    const url = input.value.trim();

if (button.disabled) return;

if (url === "") {

    message.textContent = "❌ Please paste a YouTube URL.";
    message.style.color = "red";
    return;

}

    try {

        loader.classList.remove("hidden");
        document.body.classList.add("loading");
        button.disabled = true;
        button.textContent = "⏳ Checking Video...";
        document.title = "Checking... | Mechagnaw";

        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: url
            })
        });

        const data = await response.json();

        if (data.success) {

            qualities.innerHTML = "";

            message.textContent = data.message;
            message.style.color = "green";

            document.getElementById("videoCard").classList.remove("hidden");
            document.getElementById("thumbnail").src = data.video.thumbnail;
            document.getElementById("videoTitle").textContent = data.video.title;
            document.getElementById("channelName").textContent = data.video.channel;
            document.getElementById("duration").textContent = data.video.duration;

            // ==========================
            // VIDEO BUTTONS
            // ==========================

            data.video.formats.forEach(format => {

                const btn = document.createElement("button");

                btn.textContent =
                    format.container.toUpperCase() + " " + format.quality;

                btn.addEventListener("click", () => {

                    document.querySelectorAll(".qualities button").forEach(button => {
                        button.classList.remove("selected");
                        button.disabled = true;
                    });

                    btn.classList.add("selected");


                    message.style.color = "blue";
                    message.textContent =
                        "⬇ Preparing " +
                        format.container.toUpperCase() +
                        " " +
                        format.quality +
                        "...";

                    progressContainer.classList.remove("hidden");
                    progressBar.style.width = "0%";

                    window.location.href =
    "/api/download-file?" +
    "url=" + encodeURIComponent(url) +
    "&quality=" + encodeURIComponent(format.quality) +
    "&type=video";

                });

                qualities.appendChild(btn);

            });

            // ==========================
            // AUDIO BUTTONS
            // ==========================

            data.video.audio.forEach(format => {

                const btn = document.createElement("button");

                btn.textContent = "🎵 " + format.bitrate + " kbps";

                btn.addEventListener("click", () => {

                    document.querySelectorAll(".qualities button").forEach(button => {
                        button.classList.remove("selected");
                        button.disabled = true;
                    });

                    btn.classList.add("selected");

                    message.style.color = "blue";
                    message.textContent =
                        "⬇ Preparing Audio " +
                        format.bitrate +
                        " kbps...";

                    progressContainer.classList.remove("hidden");
                    progressBar.style.width = "0%";

                    window.location.href =
    "/api/download-file?" +
    "url=" + encodeURIComponent(url) +
    "&bitrate=" + format.bitrate +
    "&type=audio";

                });

                qualities.appendChild(btn);

            });

        } else {

            message.textContent = "❌ " + data.message;
            message.style.color = "red";

        }

    } catch (error) {

        console.error(error);

        message.textContent = "❌ Server connection failed.";
        message.style.color = "red";

    } finally {

        loader.classList.add("hidden");
        button.disabled = false;
        button.textContent = "⬇ Download";
        document.title = "Mechagnaw | Free YouTube Downloader";
        document.body.classList.remove("loading");
    }

});


socket.on("download-progress", (data) => {

    progressContainer.classList.remove("hidden");

    progressBar.style.transition = "width 0.4s ease";
    progressBar.style.width = data.percent + "%";

    message.style.color = "blue";
    message.textContent =
    `⬇ ${data.percent}% | 🚀 ${data.speed} | ⏳ ETA ${data.eta}`;

    if (data.percent >= 100) {

        message.style.color = "green";
        message.textContent = "✅ Download completed!";

        setTimeout(() => {

            progressContainer.classList.add("hidden");

        }, 1000);

    }

});




