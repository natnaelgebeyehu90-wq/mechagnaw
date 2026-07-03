const express = require("express");

const router = express.Router();

const {
    downloadVideo,
    streamVideo,
    downloadFile,
    testYtDlp
} = require("../controllers/downloadController");

router.post("/download", downloadVideo);

router.get("/stream", streamVideo);

router.get("/download-file", downloadFile);

router.get("/test-ytdlp", testYtDlp);

module.exports = router;