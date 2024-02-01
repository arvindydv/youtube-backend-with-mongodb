import { Router } from "express";
import { addComment, updateComment, deleteComment, getAllComments } from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
  
router.route('/').post(verifyJwt, addComment);
router.route('/:commentId').patch(verifyJwt, updateComment);
router.route('/:commentId').delete(verifyJwt, deleteComment);
router.route('/').get(verifyJwt, getAllComments);

export default router;