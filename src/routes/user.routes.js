import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, updatePassword, getUser, updateUserDetails, updateAvatar, updateCoverImage, getChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.midleware.js";

const router = Router()

// post request
router.route('/register').post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImg",
      maxCount: 1
    }
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(verifyJwt, refreshAccessToken);

// patch request
router.route("/update-password").patch(verifyJwt, updatePassword);
router.route("/user").patch(verifyJwt, updateUserDetails);
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateAvatar);
router.route("cover-image").patch(verifyJwt, upload.single("coverImg"), updateCoverImage);

// get request
router.route("/user").get(verifyJwt, getUser);
router.route("/channel/:username").get(verifyJwt, getChannelProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistory);


export default router