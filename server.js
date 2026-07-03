require("dotenv").config();
const downloadRoutes = require("./routes/downloadRoutes");
const express = require("express");
const path = require("path");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.json());

const PORT = process.env.PORT;

// Tell Express where the website files are
app.use(express.static("public"));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"public","index.html"));
});



app.use("/api", downloadRoutes);

app.set("io", io);

// Start server
http.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});