// 1. Import express and axios
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from "fs";
import "dotenv/config";
import stripePackage from "stripe";
import { log } from "console";
import flash from "connect-flash"
import session from "express-session"

// 2. Create an express app and set the port number.
const app = express();
const port = 3000;

const secretKey = process.env.STRIPE_SECRET_KEY;
const publicKey = process.env.STRIPE_PUBLIC_KEY;
const API_URL = "https://api.stripe.com";
const stripe = stripePackage(secretKey);
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
//session to create flash message
app.use(session({ 
  secret: process.env.SECRET, 
  saveUninitialized: true, 
  resave: true 
}));

app.use(flash());

const isPurchased = false;

//items array that will appear in store. Ideally populated from a database however a manually entered array is used for simplicity
const storeItems = new Map([
  [
    1,
    {
      id: 1,
      priceInCents: 7000,
      name: "Mouse",
      category: "Electronics",
      imgSrc: "images/mouse_1.jpg",
    },
  ],
  [
    2,
    { id: 2, priceInCents: 18000, name: "Keyboard", category: "Electronics",  imgSrc: "images/keyboard_1.webp", },
  ],
  [
    3,
    { id: 3, priceInCents: 95000, name: "Graphics Card", category: "Electronics" ,  imgSrc: "images/gpu_1.jpg",},
  ],
  [4, { id: 4, priceInCents: 30000, name: "CPU", category: "Electronics" ,  imgSrc: "images/cpu_1.jpg", }],
  [
    5,
    { id: 5, priceInCents: 120000, name: "Refrigerator", category: "Appliance" ,  imgSrc: "images/fridge.jpg", },
  ],
  [6, { id: 6, priceInCents: 250000, name: "Oven", category: "Appliance", imgSrc: "images/oven.jpg", }],
  [7, { id: 7, priceInCents: 15000, name: "Microwave", category: "Appliance", imgSrc: "images/microwave.jpg", }],
  [8, { id: 8, priceInCents: 4500, name: "Toaster", category: "Appliance" , imgSrc: "images/toaster.jpg", }],
  [9, { id: 9, priceInCents: 3500, name: "Hoodie", category: "Clothing", imgSrc: "images/hoodie.jpg", }],
  [10, { id: 10, priceInCents: 45000, name: "Jacket", category: "Clothing", imgSrc: "images/jacket.jpg", }],
  [
    11,
    { id: 11, priceInCents: 2000, name: "Sweatpants", category: "Clothing", imgSrc: "images/sweatpants.jpg", },
  ],
  [12, { id: 12, priceInCents: 8500, name: "Shoes", category: "Clothing", imgSrc: "images/shoes.jpg", }],
]);

let isSearched = false

// functions to handle sorts as requested by user
function sortArrayAlphabetically(array) {
  return array.sort((a, b) => a.name.localeCompare(b.name));
}

function sortArrayByCategory(array) {
  return array.sort((a, b) => {
    const categoryComparison = a.category.localeCompare(b.category);
    if (categoryComparison !== 0) {
      return categoryComparison;
    }
    return a.name.localeCompare(b.name);
  });
}

function sortArrayLowToHigh(array) {
  return array.sort((a, b) => a.priceInCents - b.priceInCents);
}

function sortArrayHighToLow(array) {
  return array.sort((a, b) => b.priceInCents - a.priceInCents);
}

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map((item) => {
        const itemId = parseInt(item.id, 10); // Ensure ID is an integer
        const storeItem = storeItems.get(itemId);
        if (!storeItem) {
          throw new Error(`Item with ID ${itemId} not found.`);
        }
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.SERVER_URL}/success`,
      cancel_url: `${process.env.SERVER_URL}/cancel`,
    });
    req.session.isPurchased = true;
    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/success', (req,res) => {
  if (req.session.isPurchased) {
    res.render('success.ejs');
    req.session.isPurchased = false;
  }  else {
    req.flash('message', 'You must make a purchase to access this page');
    res.redirect('/store');
  }

})

app.get('/cancel', (req,res) => {
  res.redirect('/store')
})
//search route to handle user search query
app.get('/search', function(req, res) {
  const searchQuery = req.query.query.toLowerCase();
  if (searchQuery.length > 0){
    isSearched = true
  }
  const filteredItems = itemsArray.filter(item => item.name.toLowerCase().includes(searchQuery));
  res.render('store.ejs', { items: filteredItems, searched: isSearched });
});

app.get("/", (req,res) => {
  res.render("index.ejs")
})

const itemsArray = Array.from(storeItems.values());
//store route with switch to check for filter by from client
app.get("/store", (req, res) => {
  
  isSearched = false;
  const sortBy = req.query.sortBy || "title";
  switch (sortBy) {
    case "category":
      sortArrayByCategory(itemsArray);
      break;
    case "name":
      sortArrayAlphabetically(itemsArray)
      break;
    case "cheapest":
        sortArrayLowToHigh(itemsArray);
        break;
    case "expensive":
          sortArrayHighToLow(itemsArray);
          break;
    default:
      sortArrayByCategory(itemsArray);
      break;
  }
  res.render("store", { items: itemsArray, searched: isSearched,  message: req.flash('message') });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
