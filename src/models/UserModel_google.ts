import mongoose, { Document, Schema, Model } from "mongoose";

interface IAvatar {
    public_id: string;
    url: string;
}

interface IUserGoogle extends Document {
    name: string;
    avatar: IAvatar;
    role: string;
    isGoogleUser: boolean;
    googleId: string;
    createdAt: Date;
}

const userSchemaGoogle: Schema<IUserGoogle> = new Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        maxLength: [30, "Name exceeded 30 characters"],
        minLength: [4, "Please enter the name with a minimum of 4 characters"],
    },

    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },

    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },

    isGoogleUser:{
        type: Boolean,
        default: true,
    },

    googleId: {
        type: String,
        required: true,
        unique: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User_Google: Model<IUserGoogle> = mongoose.model("User_Google", userSchemaGoogle);

export default User_Google;
