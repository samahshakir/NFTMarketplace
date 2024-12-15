//server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
// const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const passport = require("./passport");

const connectMongo = require("../src/lib/db.js");

const {
  registerUser,
  loginUser,
  googleCallback,
} = require("./controllers/authController.js");
const {
  getUserInfo,
  updateUserInfo,
  getAllDesigners,
  getDesignerByUsername,
  getDesignerById,
} = require("./controllers/userController.js");
const {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionByAddress,
  getCollections,
  getCollectionByCollectionAddress,
  getAllCollections,
  getCollectionByDesignerId,
  getCollectionById,
} = require("./controllers/collectionController.js");
const {
  updateProduct,
  createProduct,
  deleteProduct,
  getCollectionProducts,
  getProductById,
  getProductsByCollectionId,
  getProductSize,
  listProduct,
  getListedProduct,
} = require("./controllers/productController.js");
const {
  addSize,
  deleteSize,
  updateSize,
} = require("./controllers/sizeController.js");
const { createNFT, getAllNFTs } = require("./controllers/nftController.js");
const { createListing } = require("./controllers/listingController.js");

// Load environment variables from .env file
// dotenv.config();

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const server = express();
const router = express.Router();

const session = require("express-session");

// Configure express-session
server.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // Replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Initialize Passport and restore authentication state, if any, from the session
server.use(passport.initialize());
server.use(passport.session());

server.use(cors());
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(router);

// MongoDB connection

connectMongo();
// USERS

// User registration route
router.post("/api/register", registerUser);
// User login route
router.post("/api/login", loginUser);
// Fetch user info route
router.get("/api/userinfo", getUserInfo);
// Update user info route
router.put("/api/userinfo", updateUserInfo);

// Google OAuth2 Routes
router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleCallback
);

// COLLECTIONS

// Create collection route
router.post("/api/collections", createCollection);
// Edit collection route
router.put("/api/collections/:id", updateCollection);
// Delete collection route
router.delete("/api/collections/:id", deleteCollection);
// Fetch collections route
router.get("/api/collections", getCollections);
// Fetch collection by address
router.get("/api/public/collections/address/:address", getCollectionByAddress);
// Add this route for fetching collection by collectionAddress
router.get(
  "/api/public/collections/address/:collectionAddress",
  getCollectionByCollectionAddress
);

// PRODUCTS

// Fetch products in a collection
router.get("/api/collections/:collectionId/products", getCollectionProducts);
// Add product to collection route
router.post("/api/products", createProduct);
// Edit product route
router.put("/api/products/:id", updateProduct);
// Delete product route
router.delete("/api/products/:id", deleteProduct);
// Fetch product by ID route
router.get("/api/products/:id", getProductById);
// Fetch all public collections route
router.get("/api/public/collections", getAllCollections);
// Public route to fetch products for a collection
router.get(
  "/api/public/collections/:collectionId/products",
  getProductsByCollectionId
);

// SIZES

// Fetch sizes for a product
router.get("/api/products/:productId/sizes", getProductSize);
// Add a size to a product
router.post("/api/sizes", addSize);
// Delete a size
router.delete("/api/sizes/:id", deleteSize);
// Update a size
router.put("/api/sizes/:id", updateSize);

// DESIGNERS

// Fetch all designers route
router.get("/api/designers", getAllDesigners);
// Fetch collections by designer route
router.get(
  "/api/collections/by-designer/:designerId",
  getCollectionByDesignerId
);
// Fetch designer by username
router.get("/api/public/designers/username/:username", getDesignerByUsername);
// Designer profile endpoint
router.get("/api/public/designers/:designerId", getDesignerById);

// RERGULAR USERS

// Fetch single collection for public users route
router.get("/api/public/collections/:id", getCollectionById);

//NFTS

router.post("/api/saveNFT", createNFT);
router.get("/api/nfts", getAllNFTs);

// LISTINGS

router.post("/api/listings", createListing);
router.post("/api/products/list", listProduct);
router.get("/api/products/listed", getListedProduct);

// Custom route handling for Next.js pages
server.all("*", (req, res) => {
  res.status(404).send("Not found");
});

server.listen(4000, () => {
  console.log("> API server ready on http://localhost:4000");
});
