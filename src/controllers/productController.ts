import { Request, Response, NextFunction } from 'express';
import Product from '../models/productModel';
import ErrorHandler from '../utils/ErrorHandler';
import catchAsyncError from '../middlewares/catchAsyncError';
import ApiFeatures from '../utils/apiFeatures';
import { Types } from 'mongoose'
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import config from "../config/firebase.config"

initializeApp(config.firebaseConfig);

interface imageInterface {
    url: string;
}

interface UserInterface extends Express.User {
    _id: Types.ObjectId;
    name: string;
    id: string;
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

// Create Product -- Admin
export const createProduct = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    try {

        const user: UserInterface = req.user as UserInterface

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found' });
        }

        const imageBuffer = req.file.buffer;
        if (!imageBuffer) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }

        const storageRef = ref(getStorage(), `files/${giveCurrentDateTime() + "_" + req.file.originalname}`);
        const metadata = {
            contentType: req.file.mimetype,
        };

        const snapshot = await uploadBytesResumable(storageRef, imageBuffer, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const image: imageInterface = {
            url: downloadURL,
        };

        req.body.images = image;
        req.body.user = user._id;
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            product,
        });
    }
    catch (error) {
        console.log(error);
    }
});


// Get all Products
export const getAllProducts = catchAsyncError(
    async (req: Request, res: Response) => {
        const resultPerPage = 8;
        const productsQuery = Product.find();
        // const productsCount = await Product.countDocuments();

        const apiFeature = new ApiFeatures(productsQuery, req.query)
            .search()
            .filter()
            .pagination(resultPerPage);

        const products = await apiFeature.query;
        const productsCount = await Product.countDocuments();

        res.status(200).json({
            success: true,
            products,
            productsCount,
            resultPerPage,
            filteredProductCount: products.length,
        });
    }
);

// Get all Products --(Admin)
export const getAdminProducts = catchAsyncError(async (req: Request, res: Response) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Get product details
export const getProductDetails = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        res.status(200).json({
            success: true,
            product,
        });
    }
);


// Update Product --admin
export const updateProduct = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Image Update
        if (req.file) {

            // Delete previous product image if it exists
            if (product.images && product.images.url) {
                try {
                    const previousImageRef = ref(getStorage(), `files/${getFileNameFromURL(product.images.url)}`);
                    await deleteObject(previousImageRef);
                }
                catch(error){
                }
            }

            //upload new Image
            const imageBuffer = req.file.buffer;
            const storageRef = ref(getStorage(), `files/${giveCurrentDateTime() + "_" + req.file.originalname}`);
            const metadata = {
                contentType: req.file.mimetype,
            };
            const snapshot = await uploadBytesResumable(storageRef, imageBuffer, metadata);
            const downloadURL = await getDownloadURL(snapshot.ref);
            const image: imageInterface = {
                url: downloadURL,
            };
            req.body.images = image;
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        res.status(200).json({
            success: true,
            product,
        });
    }
);

// Delete Product
export const deleteProduct = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const ImgDel = await Product.findById(req.params.id);

        if (!ImgDel) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Deleting from cloudinary
        try {
            const storageRefToDelete = ref(getStorage(), `files/${getFileNameFromURL(ImgDel.images.url)}`);
            await deleteObject(storageRefToDelete);
        }
        catch (error) {
        }

        const product = await Product.findOneAndDelete({ _id: req.params.id });

        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    }
);

// Create a new review or update the review
export const createProductReview = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { rating, comment, productId } = req.body;

    const user: UserInterface | any = req.user as UserInterface;
    // Create the review object
    const review = {
        user: user?._id,
        name: user?.name,
        rating: Number(rating),
        comment,
    };

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existingReview = product.reviews.find((rev) => rev.user?.toString() === user?._id?.toString());

    if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment;
    } else {
        product.reviews.push(review);
    }

    product.numberOfReviews = product.reviews.length;

    let totalRating = 0;
    product.reviews.forEach((rev) => {
        totalRating += rev.rating;
    });
    product.ratings = totalRating / product.numberOfReviews;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    });
});

// Get all review of a product
export const getProductReviews = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler('Product not Found', 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews,
    });
});

// Delete the review
export const deleteReview = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler('Product not Found', 404));
    }


    const reviews = (product.reviews as any[]).filter(
        (rev) => rev._id?.toString() !== req.query.id?.toString()
    );

    let totalRating = 0;
    reviews.forEach((rev) => {
        totalRating += rev.rating;
    });

    const ratings = totalRating / reviews.length || 0;

    const numofReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numofReviews,
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});
