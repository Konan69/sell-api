const express = require('express')
const { generateApiKey } = require('generate-api-key')
const { db } = require('./firebase')
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
app.get("/delete", async (req, res) =>{
  const{api_key} = req.query 
  const doc = await db.collection('api_keys').doc(api_key).get()
  if (!doc.exists){
    res.status(400).send({"status": "api key does not exist"})
  } else{
    const {stripeCustomerId} = doc.data()
    try {
      const customer = await stripe.customers.retrieve(
        stripeCustomerId,
        {expand: ['subscriptions']}
      )
      let subscriptionId = customer?.subscriptions?.data?.[0]?.id
      stripe.subscriptions.del(subscriptionId)
      
      const data = {
        status: null //subscription or 8
    }
    } catch (err) {
      console.log(err.msg)
      return res.sendStatus(500)
    }
  res.sendStatus(200)
  }
})

app.get('/check_status', async (req, res) => {
    const{api_key} = req.query 
    const doc = await db.collection('api_keys').doc(api_key).get()
    if (!doc.exists){
      res.status(400).send({"status": "api key does not exist"})
    } else{
      const {status} = doc.data('status')
    res.status(200).send({"status": status })
    }
})

app.get('/api', (req, res) => {
  //receive api key
  const {api_key } =req.query
  if(!api_key) return res.sendStatus(403)
  res.status(200).send({"message": 'you can do it i beleive in you'})
})


app.post('/create-checkout-session/:product', async (req,res) => {
  const {product} = req.params
  let mode, price_ID, line_items

  if(product === "sub") {
    price_ID = 'price_1NovJ6FvrMy13jtqVmvzvcCx',
    mode = 'subscription',
    line_items = [
      {
        price: price_ID
      }
    ]
    quantity_type = 'subscription'

  } else if(product === "pre"){
    price_ID = 'price_1NovHTFvrMy13jtqgpeDrT6U',
    mode = 'payment',
    line_items = [
      {
        price: price_ID,
        quantity:1
      }
    ]
    quantity_type = 10
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

  const data = {
    APIkey:newApiKey,
    paymentType: product,
    stripeCustomerId,
    status: quantity_type // subscription or 8
  }

  const dbRes = await db.collection('api_keys').doc(newApiKey).set
  (data, {merge:true})
  //use webhook to access the firebase entry for that api key and ensure
  // that billing info is iupdated

  res.redirect(303, session.url)
})

app.post('/stripe_webhook', (req, res) => {

})


app.listen(PORT, () => console.log(`connected on port ${PORT}`))