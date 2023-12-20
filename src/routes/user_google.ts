import express from "express";
import passport from "passport";
import { deleteUser, getAdminStats, getAllUser, getSingleUser, logout, myProfile, updateProfile, updateUserRole } from "../controllers/userController";
import { isAuthenticated, authorizeAdmin } from "../middlewares/auth";
import multer from "multer";

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/googlelogin", passport.authenticate("google", {
    scope: ["profile"],
}))
router.get("/login",
    // passport.authenticate("google", {
    //     scope: ["profile"],
    //     successRedirect: process.env.FRONTEND_URL
    // })
    passport.authenticate("google",{
        successRedirect: process.env.FRONTEND_URL,
    })
);

router.get("/logout", logout);

router.get("/me", isAuthenticated, myProfile);

router.route("/me/update").put(isAuthenticated, upload.single("avatar"), updateProfile);

router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUser);

router.route("/admin/users/:id")
    .get(isAuthenticated, authorizeAdmin, getSingleUser)
    .put(isAuthenticated, authorizeAdmin, updateUserRole)
    .delete(isAuthenticated, authorizeAdmin, deleteUser);

router.route("/admin/stats").get(getAdminStats);
// router.route("/admin/stats").get(isAuthenticated, authorizeAdmin, getAdminStats);

export default router;