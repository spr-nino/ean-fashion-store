import {BrowserRouter,Routes,Route,useNavigate} from 'react-router-dom';
import type {ReactNode} from 'react';
import {ClerkProvider} from '@clerk/clerk-react';
import {zhCN} from '@clerk/localizations';
import './style.css';
import {StoreProvider} from './context/StoreContext';
import {Layout} from './components/Layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import FavoritesPage from './pages/FavoritesPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PaymentPage from './pages/PaymentPage';
import JournalPage from './pages/JournalPage';
import SizeGuidePage from './pages/SizeGuidePage';
import AccountPage from './pages/AccountPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

const clerkKey=import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string|undefined;
if(!clerkKey)throw new Error('缺少 VITE_CLERK_PUBLISHABLE_KEY,请在 .env.local 中配置后重启 dev server');

function ClerkGate({children}:{children:ReactNode}){
  const nav=useNavigate();
  return <ClerkProvider
    publishableKey={clerkKey as string}
    routerPush={(to:string)=>nav(to)}
    routerReplace={(to:string)=>nav(to,{replace:true})}
    localization={zhCN}
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/account"
    signUpFallbackRedirectUrl="/account"
    appearance={{
      variables:{
        colorPrimary:'#171717',
        colorBackground:'#ffffff',
        colorText:'#171717',
        colorTextSecondary:'#6d6a64',
        colorInputBackground:'#ffffff',
        colorInputText:'#171717',
        colorDanger:'#963f36',
        borderRadius:'0px',
        fontFamily:"Arial,'Microsoft YaHei',sans-serif",
      },
      elements:{
        card:{boxShadow:'none',border:'1px solid rgba(23,23,23,.25)'},
        cardBox:{boxShadow:'none'},
        formButtonPrimary:{backgroundColor:'#171717'},
        socialButtonsBlockButton:{borderColor:'#171717'},
      },
    }}
  >{children}</ClerkProvider>;
}

export default function App(){
  return <BrowserRouter><ClerkGate><StoreProvider><Layout><Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/shop" element={<ShopPage/>}/>
    <Route path="/product/:slug" element={<ProductPage/>}/>
    <Route path="/cart" element={<CartPage/>}/>
    <Route path="/favorites" element={<FavoritesPage/>}/>
    <Route path="/checkout" element={<CheckoutPage/>}/>
    <Route path="/order-success" element={<OrderSuccessPage/>}/>
    <Route path="/orders/:id" element={<OrderDetailPage/>}/>
    <Route path="/payment/:id" element={<PaymentPage/>}/>
    <Route path="/journal" element={<JournalPage/>}/>
    <Route path="/size-guide" element={<SizeGuidePage/>}/>
    <Route path="/account" element={<AccountPage/>}/>
    <Route path="/sign-in/*" element={<SignInPage/>}/>
    <Route path="/sign-up/*" element={<SignUpPage/>}/>
    <Route path="*" element={<div className="empty">页面不存在</div>}/>
  </Routes></Layout></StoreProvider></ClerkGate></BrowserRouter>;
}
