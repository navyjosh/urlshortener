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

async function findShortUrlByUrl(url) {
  return await ShortUrl.findOne({ originalUrl: url }).then((shortUrl) => {
    return shortUrl;
  });
}
async function findShortUrlByShortUrl(url) {
  await mongoose.connect(process.env.MONGO_URI);

  return await ShortUrl.findOne({ shortUrl: url }).then((shortUrl) => {
    return shortUrl;
  });
}

async function createAndSaveUrl(url) {
  let newUrl = ShortUrl({
    originalUrl: url,
    shortUrl: makeid(5),
  });
  return await newUrl.save().then((surl) => {
    return surl;
  });
}

const app = express();
let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(async (req, res, next) => {
  console.log(`url: ${req.url}`);
  await mongoose.connect(process.env.MONGO_URI);
  next();
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", async (req, res) => {
  let isValidUrl = isUrl(req.body.url);
  if (isValidUrl) {
    if (req.body.url.match("^https?://")) {
      // valid url start here

      let shortUrl = await findShortUrlByUrl(req.body.url);
      if (!shortUrl) {
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

app.get("/api/shorturl/:code", async (req, res) => {
  let shortUrl = await findShortUrlByShortUrl(req.params.code);
  if (shortUrl) {
    res.redirect(shortUrl.originalUrl);
  }
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
