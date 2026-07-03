const { spawn } = require("child_process");

const cache = new Map();

exports.getVideoInfo = (url) => {

    if (cache.has(url)) {
        return cache.get(url);
    }

    return new Promise((resolve, reject) => {

        const process = spawn("py", [
            "-m",
            "yt_dlp",
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
                        f.acodec !== "none" &&
                        f.height
                    )
                    .map(f => ({
                        quality: f.height + "p",
                        container: f.ext,
                        formatId: f.format_id
                    }));

                const uniqueFormats = [];

                const seen = new Set();

                formats.forEach(f => {

                    const key = f.quality + "-" + f.container;

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
                    
                    cache.set(url, result);
                    
                    resolve(result);

            } catch (err) {

                reject(err);

            }

        });

    });

};