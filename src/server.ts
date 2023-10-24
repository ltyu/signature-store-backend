import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import routers  from "./routers";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());


app.use("/api", routers);

app.listen(5001, () => console.log("App listening on port 5001!"));