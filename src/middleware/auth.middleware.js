import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticate(req, res, next) {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Missing or malformed token"
            });
        }

        const token = authHeader.split(" ")[1];

        let decoded;

        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {

            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Access token expired"
                });
            }

            return res.status(401).json({
                message: "Invalid access token"
            });
        }

        console.log("Decoded Token:", decoded);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        console.log("Database User:", user);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: "Your account has been blocked"
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        next();

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}