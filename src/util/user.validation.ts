import { z } from "zod";

export const signupUserValidation = z.object({
  firstName: z
    .string({ required_error: "FIRSTNAME is required" })
    .min(3, { message: "first name must have a minimun of 3 letters" }),
  lastName: z
    .string({ required_error: "last name is required" })
    .min(3, { message: "last name must have a minimun of 3 letters" }),
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .min(1, { message: "Email is required" })
    .transform((value) => value.toLowerCase()),
  gender: z.string({
    required_error: "User gender is required",
  }),
  password: z
    .string({ required_error: "password is required" })
    .min(8, { message: "password must be minimun of 8 characters long" }),
});

export const loginUserValidation = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, { message: "Password must be 8 or more characters long" }),
});

export const changePasswordValidation = z.object({
  oldPassword: z
    .string({
      required_error: "Old Password is required",
    })
    .min(8, { message: "Password must be 8 or more characters long" }),
  newPassword: z
    .string({
      required_error: "New Password is required",
    })
    .min(8, { message: "Password must be 8 or more characters long" }),
});

export const resetPasswordValidation = z.object({
  password: z
    .string({
      required_error: "New Password is required",
    })
    .min(8, { message: "Password must be 8 or more characters long" }),
  confirmPassword: z
    .string({
      required_error: "Confirm Password is required",
    })
    .min(8, { message: "Password must be 8 or more characters long" }),
});
