const { spawn } = require("child_process");

const PYTHON =
    process.platform === "win32"
        ? "py"
        : "python3";

const path = require("path");
const fs = require("fs-extra");
const { getVideoInfo } = require("../services/videoService");

exports.downloadVideo = async (req,res)=>{

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
    
    }
    catch(error){
    
        console.error(error);
    
        res.json({
    
            success:false,
    
            message:"Unable to get video information."
    
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

    const { url, quality, bitrate, type } = req.query;

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

    let args;

if (type === "audio") {

    args = [
        "-m",
        "yt_dlp",
        "-x",
        "--audio-format",
        "mp3",
        "--ffmpeg-location",
        "C:\\Users\\FUJITSU\\AppData\\Local\\Microsoft\\WinGet\\Links",
        "-o",
        output,
        url
    ];

} else {

    args = [
        "-m",
        "yt_dlp",
    
        "--newline",

        "-f",
        `bestvideo[height<=${quality.replace("p","")}]+bestaudio`,
    
        "--merge-output-format",
        "mp4",
    
        "--ffmpeg-location",
        "C:\\Users\\FUJITSU\\AppData\\Local\\Microsoft\\WinGet\\Links",
    
        "-o",
        output,
    
        url
    ];

}

const process = spawn(PYTHON, args);

process.stdout.on("data", (data) => {

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

process.stdout.on("data", (data) => {
    console.log(data.toString());
});

process.stderr.on("data", (data) => {
    console.error(data.toString());
});

    process.on("close", async (code) => {

        if (code !== 0) {
            return res.status(500).json({

                success:false,
            
                message:"Unable to download this video. It may be private, age-restricted, temporarily unavailable, or blocked by YouTube."
            
            });
        }

        const files = await fs.readdir(path.join(__dirname, "..", "downloads"));

        const latestFile = files
            .map(file => ({
                file,
                time: fs.statSync(path.join(__dirname, "..", "downloads", file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time)[0];

        const filePath = path.join(__dirname, "..", "downloads", latestFile.file);

        res.download(filePath, latestFile.file, async () => {
            await fs.remove(filePath);
        });

    });

};


exports.testYtDlp = (req, res) => {

    const process = spawn(PYTHON, [
        "-m",
        "yt_dlp",
        "--version"
    ]);

    let output = "";

    process.stdout.on("data", (data) => {

        output += data.toString();

    });

    process.on("close", () => {

        res.send(output);

    });

};