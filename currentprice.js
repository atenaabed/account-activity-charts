//Get some prices from Geckoterminal
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3021; // Set your desired port


app.get('/analysis/:walletAddress', async (req, res) => {
  try{
    const walletAddress = req.params.walletAddress;

    // Modify the URL to include the walletAddress parameter
    const response = await axios.get(`https://address=${walletAddress}`);

    const swapSheet = response.data.balance

    // Get all CurrencyTokens in Balance 
    const listOfData = []
    swapSheet.forEach(item =>{
        const getCurrency = item['Currency Address'];
        listOfData.push(getCurrency)
    })
    //console.log(listOfData)

    
  //Get each Currency Address Separately
  const resultData = []
    listOfData.forEach(item =>{
      resultData.push(item)
    })
      
    // Push Currency Address in Gecko link for getting Current Price
      const CurrencyPrice = await axios.get(`https://api.geckoterminal.com/api/v2/simple/networks/eth/token_price/${resultData}`)
      const responseCurrencyToken = CurrencyPrice.data
      const Values = Object.values(responseCurrencyToken)
      const TokenPrice = Values.map(item => item.attributes)
      const ValueOfTokenPrice = Object.values(TokenPrice)

      //send the result
      res.send(ValueOfTokenPrice)

  

  }catch (error) {
    console.error('Error fetching or processing data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

















