import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import { UserProfile, getProfile } from '../../../lib/userprofile';

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    //Providers.GitHub({
    //  clientId: process.env.GITHUB_ID,
    //  clientSecret: process.env.GITHUB_SECRET
    //}),
    
    Providers.IdentityServer4({
        id: "idsrv",
        name: "SSAT Login",
        scope: "openid profile email userprofile ssat offline_access", // Allowed Scopes
        domain:  process.env.IdentityServer_Domain,
        clientId: process.env.IdentityServer_CLIENT_ID,
        clientSecret: process.env.IdentityServer_CLIENT_SECRET,
        profile(profile) {
          let name = "";
          if(Array.isArray(profile.name)){
            name = profile.name[0];
          } else  {
            name = profile.name;
          }
          return { ...profile, name: name, id: profile.sub }
        },
      }),
      

    // ...add more providers here
  ],
  // A database is optional, but required to persist accounts in a database
  //database: process.env.DATABASE_URL

  // Database optional. MySQL, Maria DB, Postgres and MongoDB are supported.
  // https://next-auth.js.org/configuration/databases
  //
  // Notes:
  // * You must install an appropriate node_module for your database
  // * The Email provider requires a database (OAuth providers do not)
  database: process.env.DATABASE_URL,

  // The secret should be set to a reasonably long random string.
  // It is used to sign cookies and to sign and encrypt JSON Web Tokens, unless
  // a separate secret is defined explicitly for encrypting the JWT.
  secret: process.env.SESSIONSECRET,

  session: {
    // Use JSON Web Tokens for session instead of database sessions.
    // This option can be used with or without a database for users/accounts.
    // Note: `jwt` is automatically set to `true` if no database is specified.
    jwt: true,

    // Seconds - How long until an idle session expires and is no longer valid.
    // maxAge: 30 * 24 * 60 * 60, // 30 days

    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    // updateAge: 24 * 60 * 60, // 24 hours
  },

  // JSON Web tokens are only used for sessions if the `jwt: true` session
  // option is set - or by default if no database is specified.
  // https://next-auth.js.org/configuration/options#jwt
  jwt: {
    // A secret to use for key generation - you should set this explicitly
    // Defaults to NextAuth.js secret if not explicitly specified.
    // This is used to generate the actual signingKey and produces a warning
    // message if not defined explicitly.
    secret: process.env.JWTSECRET,
    // You can generate a signing key using `jose newkey -s 512 -t oct -a HS512`
    // This gives you direct knowledge of the key used to sign the token so you can use it
    // to authenticate indirectly (eg. to a database driver)
    // signingKey: {"kty":"oct","kid":"Dl893BEV-iVE-x9EC52TDmlJUgGm9oZ99_ZL025Hc5Q","alg":"HS512","k":"K7QqRmJOKRK2qcCKV_pi9PSBv3XP0fpTu30TP8xn4w01xR3ZMZM38yL2DnTVPVw6e4yhdh0jtoah-i4c_pZagA"},
    // If you chose something other than the default algorithm for the signingKey (HS512)
    // you also need to configure the algorithm
    // verificationOptions: {
    //    algorithms: ['HS256']
    // },
    // Set to true to use encryption. Defaults to false (signing only).
    // encryption: true,
    // encryptionKey: "",
    // decryptionKey = encryptionKey,
    // decryptionOptions = {
    //    algorithms: ['A256GCM']
    // },
    // You can define your own encode/decode functions for signing and encryption
    // if you want to override the default behaviour.
    // async encode({ secret, token, maxAge }) {},
    // async decode({ secret, token, maxAge }) {},
  },

  // You can define custom pages to override the built-in ones. These will be regular Next.js pages
  // so ensure that they are placed outside of the '/api' folder, e.g. signIn: '/auth/mycustom-signin'
  // The routes shown here are the default URLs that will be used when a custom
  // pages is not specified for that route.
  // https://next-auth.js.org/configuration/pages
  pages: {
    // signIn: '/auth/signin',  // Displays signin buttons
    // signOut: '/auth/signout', // Displays form with sign out button
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // Used for check email page
    // newUser: null // If set, new users will be directed here on first sign in
  },

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed.
  // https://next-auth.js.org/configuration/callbacks
  callbacks: {
    
    // async signIn(user, account, profile) { return true },
    
    // async redirect(url, baseUrl) { return baseUrl },

    /**
     * @param  {object}  token     Decrypted JSON Web Token
     * @param  {object}  user      User object      (only available on sign in)
     * @param  {object}  account   Provider account (only available on sign in)
     * @param  {object}  profile   Provider profile (only available on sign in)
     * @param  {boolean} isNewUser True if new user (only available on sign in)
     * @return {object}            JSON Web Token that will be saved
     */
    async jwt(token, user, account, profile, isNewUser) {
        console.log(`account: ${JSON.stringify(account)}`);
        console.log(`user: ${JSON.stringify(user)}`);
        console.log(`profile: ${JSON.stringify(profile)}`);

        if(user) {  
          token.xc = user.ssat_xrmcontactid
        }

        if (account?.accessToken) {
            token.accessToken = account.accessToken
            //token.subject = account.id
        }

        if (account?.id){
          let userData = await getProfile(account.id);
          console.log(`userData:${JSON.stringify(userData)}`);
          if (userData){
            token.groups = userData.roles;
          }
        }

        return token
    },

    /**
     * @param  {object} session      Session object
     * @param  {object} token        User object    (if using database sessions)
     *                               JSON Web Token (if not using database sessions)
     * @return {object}              Session that will be returned to the client 
     */
    async session(session, token) {
        // Add property to session, like an access_token from a provider.
        
        session.xc = token.xc;
        session.groups = token.groups;  

        console.log(`token: ${JSON.stringify(token)}`);
        console.log(`sessionobject: ${JSON.stringify(session)}`);
        return session
    }
  },
  // Events are useful for logging
  // https://next-auth.js.org/configuration/events
  events: {},

  // Enable debug messages in the console if you are having problems
  debug: false,

})