const express = require('express')
const { generateApiKey } = require('generate-api-key')
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
app.get('/api', (req, res) => {
  //receive api key
  const {api_key } =req.query
  if(!api_key) return res.sendStatus(403)
  res.status(200).send({"message": 'you can do it i beleive in you'})
})


app.post('/create-checkout-session/:product', async (req,res) => {
  const {product} = req.params
  let mode, price_ID, line_items

  if(product === 'sub') {
    price_ID = 'price_1NovJ6FvrMy13jtqVmvzvcCx',
    mode = 'subscription',
    line_items = [
      {
        price: price_ID
      }
    ]

  } else if(product === "pre"){
    price_ID = 'price_1NovHTFvrMy13jtqgpeDrT6U',
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

  const newApiKey = generateApiKey()
  const customer = await stripe.customers.create({
    metadata: {
      APIkey: newApiKey
    }
  })

  const stripeCustomerId = customer.id
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    metadata: {
      APIkey: newApiKey,
      paymentType: product
    },
    line_items: line_items,
    mode: mode,
    success_url : `${domain}/success.html?api_key=${newApiKey},`,
    cancel_url: `${domain}/cancel.html,`
  })

  console.log(session)

  //create firebase record 

  //use webhook to access the firebase entry for that api key and ensure
  // that billing info is iupdated

  res.redirect(303, session.url)
})

app.post('/stripe_webhook', (req, res) => {

})


app.listen(PORT, () => console.log(`connected on port ${PORT}`))