const express = require("express");
const app = express();
const stripe = require('stripe')('sk_test_51HTk05KfFZQiWrPrEvFmmvjYs27EeySW2x4YyX2fBvBa69UbH6Mtw1WRtqBwQ33IafDgRx3HJ4bn0SkGL0dyg8Wl001pt7oSOn');

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
const formatePayPalPayerInfo = (payPalInfo) => {
  return new PaymentInfo('ivan', 'anon', 'ivan.anon@gmail.com', '4:20:690__11_9_2020', 'one_game')
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
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
  });

  res.json({ id: session.id });
});

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/views/main.html`);
});
app.get('/style.css', function(req, res) {
  res.sendFile(`${__dirname}/style.css`);
});
app.get('/addUser/', function (req, res) {
  doOnPayment()
})

app.listen(4242, () => console.log(`Listening on port ${4242}!`));