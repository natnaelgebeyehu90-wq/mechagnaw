require("dotenv").config();
const downloadRoutes = require("./routes/downloadRoutes");
const express = require("express");
const path = require("path");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Tell Express where the website files are
app.use(express.static("public"));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"public","index.html"));
});



app.use("/api", downloadRoutes);

app.set("io", io);

const fs = require("fs-extra");

setInterval(async () => {

    const folder = path.join(__dirname, "downloads");

    if (!(await fs.pathExists(folder))) return;

    const files = await fs.readdir(folder);

    for (const file of files) {

        const filePath = path.join(folder, file);

        const stat = await fs.stat(filePath);

        const age = Date.now() - stat.mtimeMs;

        if (age > 30 * 60 * 1000) {

            await fs.remove(filePath);

            console.log("Deleted:", file);

        }

    }

}, 10 * 60 * 1000);

// Start server
http.listen(PORT, () => {
    console.log(`🚀 Mechagnaw server started on port ${PORT}`);
});


