"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void;
}

export function GoogleAuthButton({ onSuccess }: GoogleAuthButtonProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) {
            onSuccess(response.credential);
          }
        }}
        onError={() => {}}
        text="continue_with"
        width="368"
        shape="rectangular"
      />
    </GoogleOAuthProvider>
  );
}
