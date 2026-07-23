import axios from "axios";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

export const verifyAppleToken = async (identityToken) => {
  if (!identityToken) {
    const error = new Error("Apple identity token is required");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.APPLE_AUDIENCE) {
    const error = new Error(
      "APPLE_AUDIENCE is not configured"
    );
    error.statusCode = 500;
    throw error;
  }

  const decodedToken = jwt.decode(identityToken, {
    complete: true,
  });

  if (!decodedToken?.header?.kid) {
    const error = new Error(
      "Invalid Apple identity token"
    );
    error.statusCode = 401;
    throw error;
  }

  try {
    const { data } = await axios.get(
      "https://appleid.apple.com/auth/keys",
      {
        timeout: 10000,
      }
    );

    const applePublicKey = data?.keys?.find(
      (key) =>
        key.kid === decodedToken.header.kid
    );

    if (!applePublicKey) {
      const error = new Error(
        "Apple public key not found"
      );
      error.statusCode = 401;
      throw error;
    }

    const publicKeyPem =
      jwkToPem(applePublicKey);

    const verifiedToken = jwt.verify(
      identityToken,
      publicKeyPem,
      {
        algorithms: ["RS256"],
        issuer:
          "https://appleid.apple.com",
        audience:
          process.env.APPLE_AUDIENCE,
      }
    );

    if (!verifiedToken?.sub) {
      const error = new Error(
        "Apple user identifier is missing"
      );
      error.statusCode = 401;
      throw error;
    }

    return {
      appleId: verifiedToken.sub,

      email:
        typeof verifiedToken.email === "string"
          ? verifiedToken.email
              .trim()
              .toLowerCase()
          : null,

      emailVerified:
        verifiedToken.email_verified === true ||
        verifiedToken.email_verified === "true",
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    console.error(
      "APPLE TOKEN VERIFICATION ERROR:",
      error.message
    );

    const authError = new Error(
      "Invalid or expired Apple identity token"
    );

    authError.statusCode = 401;

    throw authError;
  }
};
