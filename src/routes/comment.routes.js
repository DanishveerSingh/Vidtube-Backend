import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments);

router.route("/:videoId").post(addComment);

router.route("/c/:commentId").delete(deleteComment);

router.route("/c/:commentId").patch(updateComment);

export default router;
