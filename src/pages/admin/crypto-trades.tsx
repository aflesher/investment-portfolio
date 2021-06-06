import React from 'react';
import firebase, { firestore } from 'firebase';
import 'firebase/firestore';
import numeral, { format } from 'numeral';
import { graphql } from 'gatsby';
import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';

import Layout from '../../components/layout';
import { Currency } from '../../utils/enum';
import { IStoreState } from '../../store/store';

interface ICryptoTradesQuery {
	data: {
		allTrade: {
			nodes: {
				symbol: string,
				quantity: number,
				price: number,
				pnl: number,
				timestamp: number,
				currency: Currency,
				action: string
			}[]
		},
		allExchangeRate: {
			nodes: {
				rate: number
			}[]
		}
	}
}

interface IFirebaseCryptoTradesFields extends firebase.firestore.DocumentData {
    isSell: boolean,
	symbol: string,
    price: number,
    quantity: number,
	timestamp: {seconds: number, nanoseconds: number}
}

interface IFirebaseCryptoTrades extends IFirebaseCryptoTradesFields {
	docRef: firebase.firestore.DocumentReference,
	id?: string,
}

interface ICryptoTradeStateProps {
	user: firebase.User | null | undefined,
	firebase: firebase.app.App | undefined
}

const mapStateToProps = ({firebase, user}: IStoreState): ICryptoTradeStateProps => ({
	firebase,
	user
});

const DATE_FORMAT = 'DD-MM-YYYY';

const CryptoTrades: React.FC<ICryptoTradesQuery & ICryptoTradeStateProps> = ({ firebase, user, data }) => {

    const usdCad = `${_.first(data.allExchangeRate.nodes)?.rate || 1}`;
    const [firestore, setFirestore] = React.useState<firebase.firestore.Firestore | null>(null);
    const [trades, setTrades] = React.useState<IFirebaseCryptoTrades[]>([]);
    const [id, setId] = React.useState<string | null>(null);

    const [isSell, setIsSell] = React.useState<boolean>(false);
    const [symbol, setSymbol] = React.useState<string>('');
    const [price, setPrice] = React.useState<string>('');
    const [quantity, setQuantity] = React.useState<string>('');
    const [tradeDate, setTradeDate] = React.useState<string>(moment().format(DATE_FORMAT));

    const [xe, setXe] = React.useState<string>(usdCad);

	const fetchCryptoTrades = async (db: firebase.firestore.Firestore): Promise<void> => {
		const querySnapshot = await db.collection('cryptoTrades').get();

		const trades = querySnapshot.docs.map(
			(queryDocumentSnapshot: firebase.firestore.QueryDocumentSnapshot) => {
				const data = queryDocumentSnapshot.data() as IFirebaseCryptoTradesFields;
				return {
					id: queryDocumentSnapshot.id,
					docRef: queryDocumentSnapshot.ref,
					...data
				};
			}
		);

		setTrades(_.sortBy(trades, (t) => t.timestamp.seconds).reverse());
	};

    React.useEffect(() => {
		if (!firestore && firebase && firebase.firestore && user) {
			const db = firebase.firestore();
			setFirestore(db);
			fetchCryptoTrades(db);
		}
	}, [firebase, user]);

    const save = async (): Promise<void> => {
		if (!firestore) {
			return;
		}
		await fetchCryptoTrades(firestore);
		const trade = _.find(trades, q => q.id === id);
		const docRef = trade ? trade.docRef : firestore.collection('cryptoTrades').doc();

		const newTrade: IFirebaseCryptoTradesFields = {
            isSell,
            symbol,
            price: Number(price || 0),
            quantity: Number(quantity || 0),
            timestamp: moment(tradeDate, DATE_FORMAT).toDate() as any
		};
		await docRef.set(newTrade, {merge: true});
        reset();
	};

    const selectTrade = (selectedId: string) => {
        setId(selectedId);
        const trade = _.find(trades, q => q.id === selectedId);
        if (!trade) {
            return;
        }
        const date = new Date(trade.timestamp.seconds * 1000);
        setIsSell(trade.isSell);
        setSymbol(trade.symbol);
        setPrice(`${trade.price}`);
        setQuantity(`${trade.quantity}`);
        setTradeDate(moment(date).format(DATE_FORMAT));
    };

    const reset = () => {
        setId(null);
        setIsSell(false);
        setSymbol('');
        setPrice('');
        setQuantity('');
        setTradeDate(moment().format(DATE_FORMAT));
    }

    const applyXe = () => {
        const xePrice = Number(xe) * Number(price);
        setPrice(xePrice + '');
    }
    
    return(
        <Layout>
            <div className='p-4'>
                <div className='row'>
                    <div className='col-md-4'>
                        <div className='form-group pt-2'>
                            <label htmlFor='priceInput'>Symbol</label>
                            <input
                                type='text'
                                id='symbolInput'
                                className='form-control'
                                placeholder='Symbol'
                                aria-label='Symbol'
                                value={symbol}
                                onChange={e => setSymbol(e.target.value)}
                            />
                        </div>
                        <div className='form-check pt-2'>
                            <input
                                type='checkbox'
                                className='form-check-input'
                                id='is-sell'
                                checked={isSell}
                                onChange={e => setIsSell(!!e.target.checked)} />
                            <label className='form-check-label'>Is Sell</label>
                        </div>
                        <div className='form-group pt-2'>
                            <label htmlFor='priceInput'>Price</label>
                            <input
                                type='text'
                                id='priceInput'
                                className='form-control'
                                placeholder='Price'
                                aria-label='Price'
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                            />
                        </div>
                        <div className='form-group pt-2'>
                            <label htmlFor='quantityInput'>Quantity</label>
                            <input
                                type='text'
                                id='quantityInput'
                                className='form-control'
                                placeholder='Quantity'
                                aria-label='Quantity'
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className='form-group pt-2'>
                            <label htmlFor='dateInput'>Date</label>
                            <input
                                type='text'
                                id='dateInput'
                                className='form-control'
                                placeholder='DD-MM-YYYY'
                                aria-label='Date'
                                value={tradeDate}
                                onChange={e => setTradeDate(e.target.value)}
                            />
                        </div>
                        <button
                            type='button'
                            className='btn btn-primary'
                            onClick={() => save()}
                        >
                            Save
                        </button>
                    </div>
                    <div className='offset-2 col-md-4'>
                        <div className='form-group pt-2 pull-right'>
                            <label htmlFor='xeInput'>XE</label>
                            <input
                                type='text'
                                id='xeInput'
                                className='form-control'
                                placeholder='XE'
                                aria-label='XE'
                                value={xe}
                                onChange={e => setXe(e.target.value)}
                            />
                        </div>
                        <button
                            type='button'
                            className='btn btn-primary'
                            onClick={() => applyXe()}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
            <div>Crypto Trades</div>
            {trades.map(t => <div style={{cursor: 'pointer'}} className='row' onClick={() => selectTrade(t.id || '')} key={`${t.symbol}${t.price}${t.quantity}`}>
                <div className='col-1'>{t.isSell ? 'SELL' : 'BUY'}</div>
                <div className='col-1 text-uppercase'>{t.symbol}</div>
                <div className='col-2'>{numeral(t.price).format('$0,0.00')}</div>
                <div className='col-2'>{numeral(t.quantity).format('0,0.0000')}</div>
                <div className='col-2'>{!t.isSell && '-'}{numeral(t.price * t.quantity).format('$0,0.00')}</div>
                <div className='col-3'>{moment(t.timestamp.seconds * 1000).format(DATE_FORMAT)}</div>
            </div>)}
        </Layout>
    );
};

export default connect(mapStateToProps, null)(CryptoTrades);

export const pageQuery = graphql`
query {
	allTrade(filter: {accountId: {eq: 26418215}}) {
		nodes {
			symbol
			quantity
			price
			pnl
			timestamp
			currency
			action
		}
	}
    allExchangeRate(limit: 1, filter: {key: {eq: "USD_CAD"}}, sort: {fields: [date], order: DESC}) {
        nodes {
            rate
        }
    }
}
`;

