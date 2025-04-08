const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/wake", (req, res) => res.send({ status: "awake" }));

app.use("/auth", require("./routes/auth"));
app.use("/vault", require("./routes/vault"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ API prête sur le port", PORT));
