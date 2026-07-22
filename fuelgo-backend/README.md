# FuelGo Backend

This is the beginner-friendly Node.js + Express + SQLite backend for the FuelGo app.

## How to Run the Backend

1. **Install Node.js:** If you haven't already, download and install Node.js from [nodejs.org](https://nodejs.org/).
2. **Open your Terminal/Command Prompt:** Navigate into this `fuelgo-backend` folder.
   ```bash
   cd path/to/fuelgo-backend
   ```
3. **Install Dependencies:** Run this command to install all required packages:
   ```bash
   npm install
   ```
4. **Start the Server:** Start the development server (which auto-restarts when you save files):
   ```bash
   npm run dev
   ```
5. **Test it!** Open your browser and go to: [http://localhost:3000/api/prices](http://localhost:3000/api/prices). You should see JSON data of the fuel prices.

---

## Test the API with cURL

Open a new terminal window and try these commands:

**1. Get all fuel prices (Public):**
```bash
curl http://localhost:3000/api/prices
```

**2. Get nearby stations in Chennai (Public):**
```bash
curl "http://localhost:3000/api/stations?city=Chennai"
```

**3. Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d "{\"name\":\"Test User\",\"email\":\"test@fuelgo.com\",\"password\":\"123456\",\"phone\":\"9876543210\"}"
```
*(Copy the "token" from the response for the next steps!)*

**4. Place a fuel order (Requires Login):**
Replace `YOUR_TOKEN_HERE` with the token you got from the registration or login.
```bash
curl -X POST http://localhost:3000/api/orders \
-H "Authorization: Bearer YOUR_TOKEN_HERE" \
-H "Content-Type: application/json" \
-d "{\"station_id\":1,\"fuel_type\":\"petrol\",\"quantity_litres\":20,\"payment_method\":\"GPay\"}"
```

**5. View your past orders (Requires Login):**
```bash
curl http://localhost:3000/api/orders \
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Connecting to your HTML Frontend

To hook up your `index.html` frontend to this real backend, update your frontend JavaScript:

**For Live Fuel Prices:**
```javascript
fetch('http://localhost:3000/api/prices')
  .then(res => res.json())
  .then(prices => {
     // Loop through prices and update your DOM elements
     console.log(prices);
  });
```

**For Nearby Stations:**
```javascript
fetch('http://localhost:3000/api/stations?city=Chennai')
  .then(res => res.json())
  .then(stations => {
     // Update your stations grid
     console.log(stations);
  });
```

**When clicking "Place Order":**
```javascript
const token = localStorage.getItem('fuelgo_token'); // Make sure to save the token on login!

fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    station_id: 1,
    fuel_type: "petrol",
    quantity_litres: 20,
    payment_method: "GPay"
  })
})
.then(res => res.json())
.then(data => {
   if(data.order_id) {
       // Show success screen and start tracking animation
   }
});
```
