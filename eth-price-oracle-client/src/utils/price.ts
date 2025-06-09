import axios from 'axios';
import { COINGECKO_API_URL } from '../config/constants';

export async function getCurrentEthPrice(): Promise<number> {
  try {
    // use CoinGecko API to get current ETH price
    const response = await axios.get(COINGECKO_API_URL);
    const price = response.data.ethereum.usd;

    return Math.round(price);
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    throw error;
  }
}
