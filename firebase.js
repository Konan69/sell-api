

const {initializeApp,cert} = require('firebase-admin/app')
const {getFireStore} = require('firebase-admin/app')

let serviceAccount = require('./creds.json')

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFireStore

module.exports  = {db}