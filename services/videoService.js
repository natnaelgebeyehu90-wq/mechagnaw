const { spawn } = require("child_process");

const PYTHON =
    process.platform === "win32"
        ? "py"
        : "python3";

const cache = new Map();

const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

exports.getVideoInfo = (url) => {

    const cached = cache.get(url);

    if (cached && Date.now() - cached.time < CACHE_TIME) {
    return Promise.resolve(cached.data);
    }

    const fs = require("fs");

    const COOKIE_FILE =
        process.platform === "win32"
            ? "cookies.txt"
            : "/app/cookies.txt";
    
    console.log("Cookies exist:", fs.existsSync(COOKIE_FILE));

    return new Promise((resolve, reject) => {

        const fs = require("fs");

        console.log("Cookies exist:", fs.existsSync("/app/cookies.txt"));

        const process = spawn(PYTHON, [
            "-m",
            "yt_dlp",
            "--cookies",
            COOKIE_FILE,
            "--dump-single-json",
            "--no-playlist",
            "--no-warnings",
            "--skip-download",
            url
        ]);

        let output = "";
        let error = "";

        process.stdout.on("data", (data) => {
            output += data.toString();
        });

        process.stderr.on("data", (data) => {
            error += data.toString();
        });

        process.on("close", (code) => {

            if (code !== 0) {
                return reject(error);
            }

            try {

                const info = JSON.parse(output);

                const formats = info.formats
            
                .filter(f =>
                    f.vcodec !== "none" &&
                    f.height &&
                    f.ext === "mp4"
                )
                    .map(f => ({
                        quality: f.height + "p",
                        container: f.ext,
                        formatId: f.format_id
                    }));

                const uniqueFormats = [];

                const seen = new Set();

                formats
                .sort((a, b) => parseInt(a.quality) - parseInt(b.quality))
                .forEach(f => {
                
                    const key = f.quality;
                
                    if (!seen.has(key)) {
                
                        seen.add(key);
                
                        uniqueFormats.push(f);
                
                    }
                
                });


                const audio = info.formats
                    .filter(f =>
                        f.vcodec === "none" &&
                        f.acodec !== "none"
                    )
                    .map(f => ({
                        bitrate: f.abr || 128,
                        container: f.ext,
                        formatId: f.format_id
                    }));

                    const result = {

                        success: true,
                    
                        message: "Video found!",
                    
                        video: {
                    
                            title: info.title,
                    
                            channel: info.uploader,
                    
                            duration: info.duration + " seconds",
                    
                            thumbnail: info.thumbnail,
                    
                            formats: uniqueFormats,
                    
                            audio: audio
                    
                        }
                    
                    };
                    
                    cache.set(url, {
                    time: Date.now(),
                    data: result
                    });
                    
                    resolve(result);

            } catch (err) {

                reject(err);

            }

        });

    });

};