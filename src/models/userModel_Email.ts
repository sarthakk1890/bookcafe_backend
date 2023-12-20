import { Document, Schema, Model, model } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface IAvatar {
    public_id: string;
    url: string;
}

interface IUserEmail extends Document {
    name: string;
    email: string;
    password: string;
    avatar: IAvatar;
    role: string;
    isGoogleUser: boolean;
    createdAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date | number;
    getJWTtoken(): string;
    comparePassword(enteredPassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
}

const userSchemaEmail: Schema<IUserEmail> = new Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Name exceeded 30 characters'],
        minLength: [4, 'Please enter the name with a minimum of 4 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minLength: [8, 'Please enter the password with a minimum of 8 characters'],
        select: false,
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
        enum: ['admin', 'user'],
        default: 'user',
    },
    isGoogleUser: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

userSchemaEmail.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchemaEmail.methods.getJWTtoken = function (this: IUserEmail) {
    return jwt.sign({ id: this._id }, 'hello123admin789@$klo', {
        expiresIn: '5d',
    });
};

userSchemaEmail.methods.comparePassword = async function (this: IUserEmail, enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchemaEmail.methods.getResetPasswordToken = function (this: IUserEmail) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

const User_Email: Model<IUserEmail> = model<IUserEmail>('User_Email', userSchemaEmail);

export { IUserEmail, User_Email };
