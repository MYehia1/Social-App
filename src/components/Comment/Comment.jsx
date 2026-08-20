import React from "react";
import style from "./Comment.module.css";
import UpdateComment from "./../UpdateComment/UpdateComment";
import { Delete } from "lucide-react";
import DeleteComment from "./../DeleteComment/DeleteComment";

export default function Comment({ comment }) {
  const { commentCreator, createdAt, content, _id } = comment;

  return (
    <div className="w-full my-3 p-2 rounded-md border-2 border-slate-500 bg-slate-100 text-black">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={commentCreator?.photo}
            className="size-[36px] rounded-full"
            alt=""
          />
          <div className="flex flex-col">
            <span>{commentCreator?.name}</span>
            <span className="text-slate-300 text-sm">{createdAt}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center mt-2">
          <UpdateComment id={_id} />
          <DeleteComment id={_id} />
        </div>
      </div>
      <div className="px-12 py-4">{content}</div>
    </div>
  );
}
