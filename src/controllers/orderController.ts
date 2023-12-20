import { Request, Response, NextFunction } from 'express';
import Order from '../models/orderModel';
import Payment from '../models/paymentModel';
import ErrorHandler from '../utils/ErrorHandler';
import Product from '../models/productModel';
import catchAsyncError from '../middlewares/catchAsyncError';
import { Types } from 'mongoose';
import { instance } from '../server';
import crypto from 'crypto';

const returning_Days = 5;

interface UserInterface extends Express.User {
    _id: Types.ObjectId;
}

// Create new Order
export const newOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const { shippingInfo, orderItems, paymentMethod, itemPrice, deliveryCharge, totalPrice } = req.body;

    const user: UserInterface | undefined = req.user as UserInterface;

    await Order.create({
        shippingInfo,
        orderItems,
        paymentMethod,
        itemPrice,
        deliveryCharge,
        totalPrice,
        paidAt: Date.now(),
        user: user._id,
        returnDate: Date.now() + returning_Days * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
        success: true,
        message: "Order Placed Successfully via Cash On Delivery",
    });

});

// Create new Order Online
export const newOrderOnline = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const { shippingInfo, orderItems, paymentMethod, itemPrice, deliveryCharge, totalPrice } = req.body;

    const user: UserInterface | undefined = req.user as UserInterface;

    const orderOptions = {
        shippingInfo,
        orderItems,
        paymentMethod,
        itemPrice,
        deliveryCharge,
        totalPrice,
        paidAt: Date.now(),
        user: user._id,
        returnDate: Date.now() + returning_Days * 24 * 60 * 60 * 1000,
    };

    const options = {
        amount: Number(totalPrice) * 100,
        currency: "INR"
    };
    const order = await instance.orders.create(options);

    res.status(201).json({
        success: true,
        order,
        orderOptions
    });

});

//Payment verification
export const paymentVerification = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        orderOptions
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const secret: String | any = process.env.RAZORPAY_API_SECRET;
    const expectedSignature = crypto.createHmac("sha246", secret).update(body).digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        const payment = await Payment.create({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        await Order.create({
            ...orderOptions, 
            paidAt: new Date(Date.now()),
            paymentInfo: payment._id,
        })

        res.status(201).json({
            success: true,
            message: `Order Placed Successfully. Payment ID: ${payment._id}`
        })
    }
    else {
        return next(new ErrorHandler("Payment Failed", 400));
    }
})

// Get single order
export const getSingleOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next(new ErrorHandler('Order not found with this Id', 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

// Get logged in users' Orders
export const myOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const user: UserInterface | undefined = req.user as UserInterface;

    const orders = await Order.find({ user: user._id });

    res.status(200).json({
        success: true,
        orders,
    });
});

// Get all users' Orders -- Admin
export const getAllOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders,
    });
});

// Update Order Status-- Admin
export const updateOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler('Order not found with this Id', 404));
    }

    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('You have already delivered this order', 400));
    }

    order.orderStatus = req.body.status;

    if (req.body.status === 'Delivered') {
        order.orderItems.forEach(async (temp) => {
            await updateStock(temp.product, temp.quantity);
        });
        order.deliveredAt = Date.now();
    }

    await order.save({
        validateBeforeSave: false,
    });

    res.status(200).json({
        success: true,
        order,
    });
});

// Delete Order --Admin
export const deleteOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
        return next(new ErrorHandler('Order not found with this Id', 404));
    }

    res.status(200).json({
        success: true,
    });
});

// For Update Order Status route
async function updateStock(id: Types.ObjectId, quantity: number): Promise<void> {
    const product = await Product.findById(id);

    if (product) {
        product.stock -= quantity;
        await product.save({ validateBeforeSave: false });
    }
}
