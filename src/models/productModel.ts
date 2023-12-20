import { Document, Schema, model, Types } from 'mongoose';

interface Image {
    url: string;
}

interface Review {
    user: Types.ObjectId;
    name: string;
    rating: number;
    comment: string;
}

interface Product extends Document {
    name: string;
    description: string;
    price: number;
    ratings: number;
    images: Image;
    category: string;
    stock: number;
    numberOfReviews: number;
    reviews: Review[];
    user: Types.ObjectId;
    createdAt: Date;
}

const Product = new Schema<Product>({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please enter product description'],
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        maxLength: [3, 'Price limit exceeded'],
    },
    ratings: {
        type: Number,
        default: 0,
    },
    images: {
        url: {
            type: String,
            required: true,
        },
    },
    category: {
        type: String,
        required: [true, "Please specify the product's category"],
    },
    stock: {
        type: Number,
        required: [true, 'Please specify stock'],
        maxLength: [2, 'Stock limit exceeded'],
        default: 1,
    },
    numberOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
        },
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default model<Product>('Product', Product);
