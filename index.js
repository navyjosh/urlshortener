require("dotenv").config();
const express = require("express");
const cors = require("cors");
const URL = (mongoose = require("mongoose"));
const dns = require("dns");

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
  const originalUrl = req.body.url;
  console.log(`POST: url=${originalUrl}`);
  if (!originalUrl.match("^https?://")) {
    res.json({ error: "Invalid URL", msg: "Missing https?://" });
  } else {
    let domain = originalUrl.match(
      /(?m)http(?:s?):\/\/.*?([^\.\/]+?\.[^\.]+?)(?:\/|$)/
    )[1];
    console.log(`domain: ${domain}`);
    console.log(`originalUrl: ${originalUrl}`);
    dns.lookup(domain, async (err, address, family) => {
      if (err) {
        console.log(err);
        res.json({
          error: "Invalid URL",
        });
      } else {
        // valid url start here
        let shortUrl = await findShortUrlByUrl(originalUrl);
        if (!shortUrl) {
          shortUrl = await createAndSaveUrl(originalUrl);
          console.log(
            `created shortUrl: ${shortUrl.originalUrl} -> ${shortUrl.shortUrl}`
          );
        }

        res.json({
          original_url: shortUrl.originalUrl,
          short_url: shortUrl.shortUrl,
        });
      }
    });
  }
});

app.get("/api/shorturl/:code", async (req, res) => {
  let shortUrl = await findShortUrlByShortUrl(req.params.code);
  if (shortUrl) {
    console.log(`original url: ${shortUrl.originalUrl}`);
    res.redirect(301, shortUrl.originalUrl);
  }
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
