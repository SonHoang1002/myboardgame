import crypto from "crypto";

const encodePassword = (password: string): string => {
    const secret = process.env.PASSWORD_SECRET_KEY!;
    return crypto
        .createHmac("sha256", secret)
        .update(password)
        .digest("hex");
}

export { encodePassword }