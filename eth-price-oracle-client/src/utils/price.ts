import axios from 'axios';

export async function getCurrentEthPrice(): Promise<number> {
  try {
    // use CoinGecko API to get current ETH price
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const price = response.data.ethereum.usd;

    return Math.round(price);
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    throw error;
  }
}
