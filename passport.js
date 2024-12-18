const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy; 
require('dotenv').config()
const passport = require('passport')
const db = require('./src/models')

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
async function(accessToken, refreshToken, profile, cb) {
  if (profile?.id) {
      try {
          const [user, created] = await db.Users.findOrCreate({
              where: { id: profile.id }, 
              defaults: {
                  id: profile.id, 
                  email: profile.emails[0]?.value,
                  typeLogin: profile?.provider,  
                  avatar: 'static/img/default.png'
              }
          });
          return cb(null, user); 
      } catch (error) {
          console.error('Error in findOrCreate:', error);
          return cb(error, null); 
      }
  } else {
      return cb(new Error('No profile ID found'), null);
  }
}

));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback", 
    profileFields: ['email', 'photos', 'id', 'displayName'], 
  },
  async function(accessToken, refreshToken, profile, cb) {
    if (profile?.id) {
        try {
            const [user, created] = await db.Users.findOrCreate({
                where: { id: profile.id }, 
                defaults: {
                    id: profile.id, 
                    email: profile.emails[0]?.value,
                    typeLogin: profile?.provider, 
                    avatar: 'static/img/default.png'

                }
            });
            return cb(null, user); 
        } catch (error) {
            console.error('Error in findOrCreate:', error);
            return cb(error, null); 
        }
    } else {
        return cb(new Error('No profile ID found'), null);
    }
  }
));