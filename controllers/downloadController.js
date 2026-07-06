const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

const { getVideoInfo } = require("../services/videoService");

const PYTHON =
    process.platform === "win32"
        ? "py"
        : "python3";

const COOKIE_FILE = path.join(__dirname, "..", "cookies.txt");

const FFMPEG_ARGS =
    process.platform === "win32"
        ? [
            "--ffmpeg-location",
            "C:\\Users\\FUJITSU\\AppData\\Local\\Microsoft\\WinGet\\Links"
        ]
        : [];


exports.downloadVideo = async (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.json({
            success: false,
            message: "Please enter a YouTube URL."
        });
    }

    if (
        !url.includes("youtube.com/watch?v=") &&
        !url.includes("youtu.be/")
    ) {
        return res.json({
            success: false,
            message: "This is not a valid YouTube link."
        });
    }

    try {

        const result = await getVideoInfo(url);

        res.json(result);

    } catch (error) {

        console.error(error);

        res.json({
            success: false,
            message: "Unable to get video information."
        });

    }

};

exports.streamVideo = async (req, res) => {

    const url = req.query.url;

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    res.send("Received URL: " + url);

};

exports.downloadFile = async (req, res) => {

    const { url, quality = "720p", type } = req.query;

    const io = req.app.get("io");

    if (!url) {
        return res.status(400).send("No URL provided.");
    }

    const output = path.join(
        __dirname,
        "..",
        "downloads",
        "%(title)s.%(ext)s"
    );

    let args = [];

    if (type === "audio") {

        args = [
            "-m",
            "yt_dlp",

            "--cookies",
            COOKIE_FILE,

            "-x",
            "--audio-format",
            "mp3",

            ...FFMPEG_ARGS,

            "-o",
            output,

            url
        ];

    } else {

        const cleanQuality = quality.replace("p", "");

        args = [
            "-m",
            "yt_dlp",

            "--cookies",
            COOKIE_FILE,

            "--newline",

            "-f",
            `bestvideo[height<=${cleanQuality}]+bestaudio/best[height<=${cleanQuality}]`,

            "--merge-output-format",
            "mp4",

            ...FFMPEG_ARGS,

            "-o",
            output,

            url
        ];

    }

    const childProcess = spawn(PYTHON, args);

    childProcess.stdout.on("data", (data) => {

        const text = data.toString();

        console.log(text);

        const match = text.match(
            /(\d+(?:\.\d+)?)%.*?at\s+([^\s]+).*?ETA\s+([0-9:]+)/
        );

        if (match) {

            io.emit("download-progress", {

                percent: Number(match[1]),

                speed: match[2],

                eta: match[3]

            });

        }

    });

    childProcess.stderr.on("data", (data) => {

        console.error(data.toString());

    });

    childProcess.on("close", async (code) => {

        if (code !== 0) {

            return res.status(500).json({

                success: false,

                message: "Unable to download this video. It may be private, age-restricted, temporarily unavailable, or blocked by YouTube."

            });

        }

        try {

            const downloadsDir = path.join(__dirname, "..", "downloads");

            const files = await fs.readdir(downloadsDir);

            if (files.length === 0) {

                return res.status(500).json({

                    success: false,

                    message: "Downloaded file not found."

                });

            }

            const latestFile = files
                .map(file => ({
                    file,
                    time: fs.statSync(path.join(downloadsDir, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time)[0];

            const filePath = path.join(downloadsDir, latestFile.file);

            res.download(filePath, latestFile.file, async () => {

                await fs.remove(filePath);

            });

        } catch (err) {

            console.error(err);

            if (!res.headersSent) {

                res.status(500).send("File download failed.");

            }

        }

    });

};

exports.testYtDlp = (req, res) => {

    const childProcess = spawn(PYTHON, [

        "-m",

        "yt_dlp",

        "--cookies",

        COOKIE_FILE,

        "--version"

    ]);

    let output = "";

    childProcess.stdout.on("data", (data) => {

        output += data.toString();

    });

    childProcess.stderr.on("data", (data) => {

        console.error(data.toString());

    });

    childProcess.on("close", () => {

        res.send(output);

    });

};