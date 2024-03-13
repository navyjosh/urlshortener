require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { isUrl } = require("check-valid-url");

mongoose = require("mongoose");

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const shortUrlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
});
let ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

async function findShortUrl(url) {
  console.log("connect");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("findOne");
  return await ShortUrl.findOne({ originalUrl: url }).then((shortUrl) => {
    console.log(`shortUrl: ${shortUrl}`);
    return shortUrl;
  });
}

async function createAndSaveUrl(url) {
  console.log("create and save");
  let newUrl = ShortUrl({
    originalUrl: url,
    shortUrl: makeid(5),
  });
  return await newUrl.save().then((surl) => {
    console.log(`surl: ${surl}`);
    return surl;
  });
}

const app = express();
let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", async (req, res) => {
  console.log("isValidUrl()");
  let isValidUrl = isUrl(req.body.url);
  if (isValidUrl) {
    console.log("url is valid");
    if (req.body.url.match("^https?://")) {
      // valid url start here
      console.log("valid");
      let shortUrl = await findShortUrl(req.body.url);
      if (!shortUrl) {
        console.log("not found");
        shortUrl = await createAndSaveUrl(req.body.url);
      }
      return res.json({
        original_url: shortUrl.originalUrl,
        short_url: shortUrl.shortUrl,
      });
    }
  }
  // not valid url
  res.json({
    error: "Invalid URL",
  });
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
