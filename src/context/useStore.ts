import {useContext} from 'react';import {Store} from './StoreContext';export const useStore=()=>{const c=useContext(Store);if(!c)throw Error('StoreProvider missing');return c};
