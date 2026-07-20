import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import userModel from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value
          ?.trim()
          .toLowerCase();

        const name = profile.displayName || "Google User";
        const profileImage =
          profile.photos?.[0]?.value || null;

        if (!googleId || !email) {
          return done(
            new Error(
              "Google did not provide the required account information"
            ),
            null
          );
        }

        let user = await userModel.findOne({
          $or: [
            { googleId },
            { email },
          ],
        });

        if (user) {
          if (user.isBlocked) {
            return done(
              new Error("Your account has been blocked"),
              null
            );
          }

          let shouldUpdate = false;

          if (!user.googleId) {
            user.googleId = googleId;
            shouldUpdate = true;
          }

          if (!user.profileImage && profileImage) {
            user.profileImage = profileImage;
            shouldUpdate = true;
          }

          if (!user.isVerified) {
            user.isVerified = true;
            shouldUpdate = true;
          }

          if (user.authProvider !== "google") {
            user.authProvider = "google";
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await user.save();
          }
        } else {
          user = await userModel.create({
            name,
            email,
            googleId,
            profileImage,
            authProvider: "google",
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;