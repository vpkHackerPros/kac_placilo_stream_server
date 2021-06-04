const fetch = require('node-fetch');

const apiKey = 'AZFNNNX_HYs8hJkRx4Krnt2zjH6otcyL:'

const userData = {
  name : "First Last",
  email : "customer@email.com",
  product : "https://ec-kaclivestreaming.vhx.tv/products/test",
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