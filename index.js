const express = require("express");
const app = express();
const stripe = require('stripe')('sk_test_51HTk05KfFZQiWrPrEvFmmvjYs27EeySW2x4YyX2fBvBa69UbH6Mtw1WRtqBwQ33IafDgRx3HJ4bn0SkGL0dyg8Wl001pt7oSOn');
const bodyParser = require('body-parser');

app.use(express.static('public'));
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

const generatePassword = () => {
  return 'burek2020'
}

const getEmailBody = (payementInfo) => {
  return `Živjo!\nTukaj imaš geslo: ${generatePassword()}`
}
const sendEmail = ( address, body ) => {
  console.log(`sending email to ${address} with body: \n ${body}`)
}
const addPaymentToDataBase = ( paymentInfo ) => {
  console.log('Adding to data base.')
}
const formateStripePayerInfo = (stripeInfo) => {
  return new PaymentInfo('ivan', 'anon', 'ivan.anon@gmail.com', '4:20:690__11_9_2020', 'one_game')
}
const formatPayPalPayerInfo = (payPalInfo) => {
  console.log('uuuu senpai ur server got paypaaaaal infoooo')
  console.log(payPalInfo)
  console.log(payPalInfo.update_time)
  console.log('email' + payPalInfo.payer.email.email_address)
  console.log('name' + payPalInfo.payer.name.given_name)
  console.log('surname' + payPalInfo.payer.name.surname)
  console.log('time' + payPalInfo.update_time)
  return new PaymentInfo(
    payPalInfo.payer.name.given_name, 
    payPalInfo.payer.name.surname, 
    payPalInfo.payer.email.email_address, 
    payPalInfo.update_time, 
    'paypal_one_stream'
  )
}

const doOnPayment = ( paymentInfo ) => {
  //tole sprejme podatke o plačniku
  sendEmail(paymentInfo.email, getEmailBody(paymentInfo))
  addPaymentToDataBase(paymentInfo)
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
    data = JSON.parse(req.body);
  } catch (err) {
    console.log('Didnit parse,')
  }
  console.log('startData =', data)
  doOnPayment(formatPayPalPayerInfo(data))
  res.sendStatus(200)
})

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/views/main.html`);
});
app.get('/success', function(req, res) {
  res.sendFile(`${__dirname}/views/success.html`);
});
app.get('/style.css', function(req, res) {
  res.sendFile(`${__dirname}/style.css`);
});



/*Stripe on payment test*/

app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
  let event;

  try {
    event = JSON.parse(request.body);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!');
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod was attached to a Customer!');
      break;
    // ... handle other event types
    default:
      // Unexpected event type
      return response.status(400).end();
  }

  // Return a 200 response to acknowledge receipt of the event
  response.json({received: true});
});

app.listen(4242, () => console.log(`Listening on port ${4242}!`));