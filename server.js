const express = require('express')
const app = express()
const PORT = 1337
require('dotenv').config()

//Variabes
STRIPE_SECRET_KEY = process.env.STRIPE_SK
const stripe = require('stripe')(STRIPE_SECRET_KEY)
const domain = 'http://localhost:1337'

//middleware
app.use(express.static('public'))


//routes

app.post('create-checkout-session/:product', (req,res) => {
  const {product} = req.params
  let mode, price_ID, line_items

  if(product === 'sub') {
    price_ID = '',
    mode = 'subscription',
    line_items = [
      {
        price: price_ID
      }
    ]

  } else if(product === "pre"){
    price_ID = '',
    mode = 'payment',
    line_items = [
      {
        price: price_ID,
        quantity:1
      }
    ]
  } else {
    return res.sendStatus(403)
  }
})


app.listen(PORT, () => console.log(`connected on port ${PORT}`))