/* global process */
const config = {};

config.currency = {
	api:
		process.env.CURRENCY_API_URL || 'https://free.currconv.com/api/v7/convert',
	apiKey: process.env.CURRENCY_API_KEY,
};

config.firebase = {
	private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
	private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
	apiKey: 'AIzaSyD7uF-RMhe-bhqipiygJse64Zh9eH-TPEU',
	authDomain: 'dollar-jockey-5d690.firebaseapp.com',
	projectId: 'dollar-jockey-5d690',
};

config.questrade = {
	cryptSecret: process.env.QUESTRADE_CRYPT_SECRET,
};

config.coinmarketcap = {
	api: 'https://pro-api.coinmarketcap.com',
	apiKey: process.env.COINMARKETCAP_API_KEY,
};

config.binance = {
	api: 'https://api.binance.com',
	apiKey: process.env.BINANCE_API_KEY,
	secretKey: process.env.BINANCE_API_SECRET,
};

config.openexchangerates = {
	api: 'https://openexchangerates.org/api/',
	appId: process.env.OPEN_EXCHANGE_RATES_APP_ID,
};

config.kraken = {
	key: process.env.KRAKEN_API_KEY,
	secret: process.env.KRAKEN_API_SECRET,
};

module.exports = config;
