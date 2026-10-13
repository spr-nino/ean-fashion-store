import {SignUp} from '@clerk/clerk-react';

export default function SignUpPage(){
  return <main className="authPage" aria-label="注册 EAN 账户">
    <small>EAN ACCOUNT</small>
    <SignUp routing="path" path="/sign-up" signInUrl="/sign-in"/>
  </main>;
}
