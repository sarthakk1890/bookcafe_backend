import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import passport from 'passport';
import User_Google from '../models/UserModel_google'
import crypto from 'crypto';

const client_id: string = process.env.GOOGLE_CLIENT_ID || '';
const client_secret: string = process.env.GOOGLE_CLIENT_SECRET || '';

export const connectPassport = () => {

  passport.use(
    new GoogleStrategy(
      {
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async function (accessToken, refreshToken, profile, done) {

        const user = await User_Google.findOne({
          googleId: profile.id,
        });

        if (!user) {
          const newUser = await User_Google.create({
            googleId: profile.id,
            name: profile.displayName,
            avatar: {
              public_id: 'abcc',
              url: profile.photos && profile.photos[0]?.value,
            },
          });

          return done(null, newUser);
        } else {
          return done(null, user);
        }
      }
    )
  );


  passport.serializeUser((user, done) => {
    done(null, (user as any).id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User_Google.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
