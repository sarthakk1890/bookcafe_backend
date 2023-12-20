import express, { Router } from "express";
import {
    newOrder,
    getSingleOrder,
    myOrders,
    getAllOrders,
    updateOrders,
    deleteOrder,
    newOrderOnline,
    paymentVerification,
} from "../controllers/orderController";
import { isAuthenticated, authorizeAdmin } from "../middlewares/auth";

const router: Router = express.Router();

router.route("/order/new").post(isAuthenticated, newOrder);

// router.route("/order/new/online").post(isAuthenticated, newOrderOnline);

// router.route("/paymentverification").post(isAuthenticated, paymentVerification);

router.route("/order/:id").get(isAuthenticated, getSingleOrder);

router.route("/orders/me").get(isAuthenticated, myOrders);

router
  .route("/admin/orders")
  .get(isAuthenticated, authorizeAdmin, getAllOrders);

router
  .route("/admin/order/:id")
  .get(isAuthenticated, authorizeAdmin, updateOrders)
  .delete(isAuthenticated, authorizeAdmin, deleteOrder);


// Testing Routes

// router.route("/order/new").post(newOrder);
router.route("/order/new/online").post(newOrderOnline);
router.route("/paymentverification").post(paymentVerification);
// router.route("/order/:id").get(getSingleOrder);
// router.route("/orders/me").get(myOrders);
// router
//   .route("/admin/orders")
//   .get(getAllOrders);
// router
//   .route("/admin/order/:id")
//   .put(updateOrders)
//   .delete(deleteOrder);



export default router;
