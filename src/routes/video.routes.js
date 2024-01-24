import { Router } from "express";
import { publishAVideo, getVideoById, getAllVideo, updateVideo, togglePublishing, deleteVideo } from "../controllers/video.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.midleware.js";

const router = Router();

// post request
router.route('/publish-video').post(verifyJwt, upload.fields([
    {
      name: "videoFile",
      maxCount: 1
    },
    {
      name: "thumbnail",
      maxCount: 1
    }
  ]), publishAVideo);


//   get request
router.route('/video/:videoId').get(verifyJwt, getVideoById);
router.route('/').get(verifyJwt, getAllVideo);

// patch request
router.route('/video/:videoId').patch(verifyJwt, updateVideo);
router.route('/toggle-publish/:videoId').patch(verifyJwt, togglePublishing);

// delete request
router.route('/video/:videoId').delete(verifyJwt, deleteVideo);


export default router