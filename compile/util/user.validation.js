"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordValidation = exports.changePasswordValidation = exports.loginUserValidation = exports.signupUserValidation = void 0;
const zod_1 = require("zod");
exports.signupUserValidation = zod_1.z.object({
    firstName: zod_1.z
        .string({ required_error: "FIRSTNAME is required" })
        .min(3, { message: "first name must have a minimun of 3 letters" }),
    lastName: zod_1.z
        .string({ required_error: "last name is required" })
        .min(3, { message: "last name must have a minimun of 3 letters" }),
    email: zod_1.z
        .string()
        .email({ message: "Invalid email format" })
        .min(1, { message: "Email is required" })
        .transform((value) => value.toLowerCase()),
    gender: zod_1.z.string({
        required_error: "User gender is required",
    }),
    password: zod_1.z
        .string({ required_error: "password is required" })
        .min(8, { message: "password must be minimun of 8 characters long" }),
});
exports.loginUserValidation = zod_1.z.object({
    email: zod_1.z.string({ required_error: "Email is required" }).email(),
    password: zod_1.z
        .string({
        required_error: "Password is required",
    })
        .min(8, { message: "Password must be 8 or more characters long" }),
});
exports.changePasswordValidation = zod_1.z.object({
    oldPassword: zod_1.z
        .string({
        required_error: "Old Password is required",
    })
        .min(8, { message: "Password must be 8 or more characters long" }),
    newPassword: zod_1.z
        .string({
        required_error: "New Password is required",
    })
        .min(8, { message: "Password must be 8 or more characters long" }),
});
exports.resetPasswordValidation = zod_1.z.object({
    password: zod_1.z
        .string({
        required_error: "New Password is required",
    })
        .min(8, { message: "Password must be 8 or more characters long" }),
    confirmPassword: zod_1.z
        .string({
        required_error: "Confirm Password is required",
    })
        .min(8, { message: "Password must be 8 or more characters long" }),
});
