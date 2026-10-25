import cors from 'cors';

export const corsMiddleware = () => cors({
  origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:5173',
        process.env.FRONTEND_URL
      ]
      if(ACCEPTED_ORIGINS.includes(origin)){
        return callback(null, true)
      }

      if(!origin){
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  })