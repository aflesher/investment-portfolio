import { createContext } from 'react';
import { Currency } from '../utils/enum';

export const CurrencyContext = createContext<Currency>(Currency.cad);
