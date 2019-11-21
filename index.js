require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const formidableMiddleware = require("express-formidable");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

// const nodemon = require('nodemon'); NON

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Créer un model
const User = mongoose.model("User", {
  name: String,
  city: String,
  picture: String
});
const Picture = mongoose.model("Picture", {
  url: String
});

// Créer le serveur
const app = express();

// Activer formidable
app.use(formidableMiddleware());

// Activer cors
// Accepte toutes les connexions
app.use(cors());

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Créer des routes
// A chaque fois qu'un visiteur ira sur la page d'accueil, cette fonction sera déclenchée
app.get("/", (req, res) => {
  // req = request
  // res = response
  res.json({ message: "Hello World" });
});

app.get("/users", async (req, res) => {
  // Cette route servira à afficher tous les utilisateurs
  try {
    const users = await User.find();
    res.json(users);
  } catch (e) {
    console.error(e.message);
    res.status(400).json({ message: "An error occurred" });
  }
});

app.post("/user", async (req, res) => {
  // Cette route servira à créer un utilisateur
  try {
    const newUser = new User({ name: req.body.name, city: req.body.city });
    // Sauvegarder dans la DB
    await newUser.save();
    res.json(newUser);
  } catch (e) {
    console.error(e.message); // User validation failed: city: Cast to String failed for value "[]" at path "city"
    res.status(400).json({ message: "An error occurred" });
  }
});

app.post("/add-photo-to-user", async (req, res) => {
  const id = "5dd659d5bb1e69073f631c0e";

  try {
    const user = await User.findById(id);

    cloudinary.uploader.upload(req.files.picture.path, async function(
      error,
      result
    ) {
      if (!error) {
        user.picture = result.secure_url;
        await user.save();

        res.json(user);
      } else {
        res.status(400).json({ message: "An error occurred" });
      }
    });
  } catch (e) {
    res.status(400).json({ message: "An error occurred" });
  }
});

app.post("/upload", (req, res) => {
  console.log(req.files); // {File}
  console.log(req.fields); // title

  const keys = Object.keys(req.files);
  console.log(keys); // ['picture']
  // Récupérer le fichier
  console.log(req.files.picture.path);

  // Le sauvegarder sur Cloudinary
  cloudinary.uploader.upload(req.files.picture.path, async function(
    error,
    result
  ) {
    if (!error) {
      // On sauvegardera l'url du fichier hébergé sur Cloudinary dans notre base de donnée
      // console.log(result.secure_url);

      const newPicture = new Picture({
        url: result.secure_url
      });

      await newPicture.save();

      res.json(newPicture);
    } else {
      res.status(400).json({ message: "An error occurred" });
    }
  });
});

// Démarrer le server
app.listen(process.env.PORT, () => {
  console.log("Server started");
});
