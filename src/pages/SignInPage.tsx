import {SignIn} from '@clerk/clerk-react';

export default function SignInPage(){
  return <main className="authPage" aria-label="登录 EAN">
    <small>EAN ACCOUNT</small>
    <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up"/>
  </main>;
}
