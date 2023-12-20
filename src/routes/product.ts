import express, { Router } from "express";
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDetails,
    createProductReview,
    getProductReviews,
    deleteReview,
    getAdminProducts,
} from "../controllers/productController";
import { isAuthenticated, authorizeAdmin } from "../middlewares/auth";
import multer from "multer";


// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const router: Router = express.Router();

router.route("/products").get(getAllProducts);

router.route("/admin/products").get(isAuthenticated, authorizeAdmin, getAdminProducts);

router.route("/admin/product/new").post(isAuthenticated, authorizeAdmin, upload.single("images"), createProduct);

// router
//     .route("/admin/products/:id")
//     .put(isAuthenticated, authorizeAdmin, upload.single("images"), updateProduct)
//     .delete(isAuthenticated, authorizeAdmin, deleteProduct);

router.route("/product/:id").get(getProductDetails);

router.route("/review").put(isAuthenticated, createProductReview);

router
    .route("/reviews")
    .get(getProductReviews) //id is passed in query
    .delete(isAuthenticated, deleteReview);


//Testing Routes

// router.route("/products").get(getAllProducts);
// router.route("/review").put(createProductReview);
// router.route("/admin/product/new").post(upload.single("images"), createProduct);
// router.route("/product/:id").get(getProductDetails);
// router.route("/admin/products").get(getAdminProducts);
router
  .route("/admin/products/:id")
  .put(upload.single("images"), updateProduct)
  .delete(deleteProduct);
// router
//     .route("/reviews")
//     .get(getProductReviews)
//     .delete(deleteReview);

export default router;
