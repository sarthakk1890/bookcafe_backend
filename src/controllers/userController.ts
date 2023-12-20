import { Request, Response, NextFunction } from 'express';
import catchAsyncError from '../middlewares/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';
import User from '../models/UserModel_google';
import { Types } from 'mongoose';
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import config from "../config/firebase.config"
import User_Google from '../models/UserModel_google';
import Order from '../models/orderModel';

initializeApp(config.firebaseConfig);

interface imageInterface {
    public_id: string;
    url: string;
}

interface UserInterface extends Express.User {
    _id: Types.ObjectId;
    avatar: imageInterface
}

const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + ' ' + time;
    return dateTime;
}

const getFileNameFromURL = (url: string): string => {
    const urlParts = url.split('/');
    const encodedImageNamePart = urlParts.find(part => part.includes('%2F'));
    if (encodedImageNamePart === undefined) {
        throw new Error('Encoded image name not found in URL.');
    }
    const decodedImageName = decodeURIComponent(encodedImageNamePart);
    const imageName = decodedImageName.replace('files/', '');
    const imageNameWithoutQueryString = imageName.split('?')[0];
    return imageNameWithoutQueryString;
};

export const myProfile = (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
        success: true,
        user: req.user as UserInterface, // Assuming req.user is of type UserInterface
    });
};

export const logout = (req: Request, res: Response, next: NextFunction): void => {
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid", {
            secure: process.env.NODE_ENV === "development" ? false : true,
            httpOnly: process.env.NODE_ENV === "development" ? false : true,
            sameSite: process.env.NODE_ENV === "development" ? false : "none"
        });
        res.status(200).json({
            message: "Logged Out Successfully",
        });
    });
};

// Update Profile
export const updateProfile = catchAsyncError(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const newUser: { name: string; avatar?: imageInterface } = {
        name: req.body.name,
        // email: req.body.email,
    };

    const currentUser: UserInterface | undefined = req.user as UserInterface;

    if (req.file) {
        const imageBuffer = req.file.buffer;

        // Delete previous avatar image
        if (currentUser.avatar && currentUser.avatar.url) {
            try {
                const storageRefToDelete = ref(getStorage(), `files/${getFileNameFromURL(currentUser.avatar.url)}`);
                await deleteObject(storageRefToDelete);
            }
            catch (error) {
            }
        }

        // Upload new avatar image
        const storageRef = ref(getStorage(), `files/${giveCurrentDateTime() + "_" + req.file.originalname}`);
        const metadata = {
            contentType: req.file.mimetype,
        };

        const snapshot = await uploadBytesResumable(storageRef, imageBuffer, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const image: imageInterface = {
            public_id: 'some_public_id',
            url: downloadURL,
        };

        newUser.avatar = image;
    }

    const updatedUser = await User.findByIdAndUpdate(currentUser._id, newUser, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        user: updatedUser,
    });
});


// Get All Users (Admin)
export const getAllUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});


// Get single User (Admin)
export const getSingleUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`, 400));
    }

    res.status(200).json({
        success: true,
        user,
    });
});


// Update User Role (Admin)
export const updateUserRole = catchAsyncError(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const newUser = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    const updatedUser = await User.findByIdAndUpdate(req.params.id, newUser, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    if (!updatedUser) {
        return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`, 400));
    }

    res.status(200).json({
        success: true,
        user: updatedUser,
    });
});


// Delete User (Admin)
export const deleteUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`, 400));
    }

    // Delete avatar image
    if (user.avatar && user.avatar.url) {
        try {
            const storageRefToDelete = ref(getStorage(), `files/${getFileNameFromURL(user.avatar.url)}`);
            await deleteObject(storageRefToDelete);
        }
        catch (error) {
        }
    }

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});


//Get Admin stats
export const getAdminStats = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const usersCount = await User_Google.countDocuments();
    const orders = await Order.find({});

    const processingOrder = orders.filter((i) => i.orderStatus === "Processing");
    const deliveredOrder = orders.filter((i) => i.orderStatus === "Delivered");

    let totalIncome = 0;
    orders.forEach(i => {
        totalIncome += i.totalPrice;
    });

    res.status(200).json({
        success: true,
        usersCount,
        ordersCount: {
            total: orders.length,
            processing: processingOrder.length,
            delivered: deliveredOrder.length
        },
        totalIncome
    })
})
