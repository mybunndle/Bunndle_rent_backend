import axios from "axios";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

export const verifyAppleToken = async (identityToken) => {
  console.log(identityToken);
  const decodedToken = jwt.decode(identityToken, {
    complete: true,
  });

  if (!decodedToken?.header?.kid) {
    const error = new Error("Invalid Apple identity token");
    error.statusCode = 401;
    throw error;
  }

  const { data } = await axios.get(
    "https://appleid.apple.com/auth/keys",
    {
      timeout: 10000,
    }
  );

  const applePublicKey = data?.keys?.find(
    (key) => key.kid === decodedToken.header.kid
  );

  if (!applePublicKey) {
    const error = new Error("Apple public key not found");
    error.statusCode = 401;
    throw error;
  }

  const publicKeyPem = jwkToPem(applePublicKey);

  const verifiedToken = jwt.verify(
    identityToken,
    publicKeyPem,
    {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_CLIENT_ID,
    }
  );

  return {
    appleId: verifiedToken.sub,
    email: verifiedToken.email || null,
    emailVerified:
      verifiedToken.email_verified === true ||
      verifiedToken.email_verified === "true",
  };
};