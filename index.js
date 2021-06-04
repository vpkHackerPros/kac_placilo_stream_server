const express = require("express")
const app = express()
const stripe = require('stripe')('sk_test_51HTk05KfFZQiWrPrEvFmmvjYs27EeySW2x4YyX2fBvBa69UbH6Mtw1WRtqBwQ33IafDgRx3HJ4bn0SkGL0dyg8Wl001pt7oSOn')
const bodyParser = require('body-parser')
const nodeoutlook = require('nodejs-nodemailer-outlook')

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.set('views', './views')

class PaymentInfo {
  constructor (name, surname, email, time, product) {
    this.name = name
    this.surname = surname
    this.email = email
    this.time = time
    this.product = product
  }
}
const emailCredentials = {
  email: "live.streaming@vpk.si",
  password: "Poletje@007"
}
const productLink = "https://ec-kaclivestreaming.vhx.tv/products/test"


const doOnPayment = ( paymentInfo ) => {
  sendEmail(paymentInfo.email, getEmailBody(paymentInfo))
  addCustomerToVimeo(paymentInfo.email, productLink)
}

const addCustomerToVimeo = (email, product) => {
  const apiKey = 'AZFNNNX_HYs8hJkRx4Krnt2zjH6otcyL'
  const userData = {
    name : "First Last",
    email : "customer@email.com",
    product : productLink,
    plan : "standard"
  }
  fetch('https://ec-kaclivestreaming.vhx.tv/customers', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  .then(response => response.text())
  .then((response) => console.log(response))
  .catch(error => console.error(error));
}

const sendEmail = (sendTo, name, link) => {
  nodeoutlook.sendEmail({
    auth: {
      user: emailCredentials.email,
      pass: emailCredentials.password
    },
    from: emailCredentials.email,
    to: sendTo,
    subject: 'Payment Confirmation',
    html: ` ${name} thank you for purchasing the access to the match. </br> The game will be accessible on the day of the game 15 minutes before the start on this button <a href= '${link}'>Press here to win 10 million dollars </a>. </br> </br> <b>Your EC-KAC</b>.` ,

    onError: (e) => {
      console.log(e)
    },
    onSuccess: (i) => {
      console.log(i)
    }
  })
}

const formateStripePayerInfo = (data) => {
  console.log('name '    + data.shipping.name)
  console.log('surname ' + '')
  console.log('email '   + data.receipt_email)
  console.log('time '    + data.created)
  return new PaymentInfo(
    data.shipping.name, 
    '',
    data.receipt_email, 
    data.created, 
    'paypal_one_stream'
  )
}

const formatPayPalPayerInfo = (data) => {
  console.log('name '    + data.payPalInfo.payer.name.given_name)
  console.log('surname ' + data.payPalInfo.payer.name.surname)
  console.log('email '   + data.payPalInfo.payer.email_address)
  console.log('time '    + data.payPalInfo.update_time)
  return new PaymentInfo(
    data.payPalInfo.payer.name.given_name, 
    data.payPalInfo.payer.name.surname, 
    data.payPalInfo.payer.email_address, 
    data.payPalInfo.update_time, 
    'paypal_one_stream'
  )
}

app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "match stream access",
          },
          unit_amount: 550,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:4242/success",
    cancel_url: "https://example.com/cancel",
  });

  res.json({ id: session.id });
});
app.post('/onPayPalPayment', bodyParser.raw({type: 'application/json'}), (req, res) => {
  let data
  try {
    data = JSON.parse(req.body)
  } catch (err) {
    console.log('Didnit parse,')
  }
  console.log('startData =', data)
  doOnPayment(formatPayPalPayerInfo(data))
  res.sendStatus(200)
})

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/views/main.html`)
});
app.get('/success', function(req, res) {
  res.sendFile(`${__dirname}/views/success.html`)
});
app.get('/style.css', function(req, res) {
  res.sendFile(`${__dirname}/style.css`)
});



app.post('/stripe_webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
  let event
  try {
    event = JSON.parse(request.body)
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`)
  }
  switch (event.type) {
    case 'payment_intent.succeeded':
      const data = event.data.object
      console.log('PaymentIntent was successful!')
      console.log(data)
      console.log('')
      console.log(data.receipt_email)
      doOnPayment(formateStripePayerInfo(data))

      break
    case 'payment_method.attached':
      const paymentMethod = event.data.object
      console.log('PaymentMethod was attached to a Customer!')
      break
    default:
      return response.status(400).end()
  }

  // Return a 200 response to acknowledge receipt of the event
  response.json({received: true})
});

app.listen(4242, () => console.log(`Listening on port ${4242}!`))