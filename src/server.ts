import app from './app';
import { connectDB } from './config/database';
import Razorpay from 'razorpay';

connectDB();
const port = process.env.PORT;

// Check if RAZORPAY_API_KEY is defined before using it
if (!process.env.RAZORPAY_API_KEY) {
  console.error('RAZORPAY_API_KEY is not defined. Please set the environment variable.');
  process.exit(1);
}

// Check if RAZORPAY_API_SECRET is defined before using it
if (!process.env.RAZORPAY_API_SECRET) {
  console.error('RAZORPAY_API_SECRET is not defined. Please set the environment variable.');
  process.exit(1);
}


export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

app.get("/", (req, res, next) => {
  res.send("<h1>Working</h1>");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port} and in ${process.env.NODE_ENV} mode`);
});
