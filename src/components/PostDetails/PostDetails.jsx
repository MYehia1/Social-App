import React from "react";
import style from "./PostDetails.module.css";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Comment from "../Comment/Comment";
import CreateCommentModal from "./../CreateCommentModal/CreateCommentModal";
import UpdatePost from "../UpdatePost/UpdatePost";
import DeletePost from "../DeletePost/DeletePost";

export default function PostDetails() {
  let { id } = useParams();

  function getSinglePost() {
    return axios.get(
      `https://linked-posts.routemisr.com/posts/${id}
`,
      {
        headers: {
          token: localStorage.getItem("userToken"),
        },
      }
    );
  }
  let { data, isError, isLoading, error } = useQuery({
    queryKey: ["getSinglePost"],
    queryFn: getSinglePost,
    select: (data) => data?.data?.post,
  });

  return (
    <>
      <div className="w-full md:w-[80%] lg:w-[60%] rounded-md bg-slate-200 p-4 mx-auto my-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div>
              <img
                src={data?.user.photo}
                className="size-[36px] rounded-full"
                alt=""
              />
            </div>
            <div>
              <p>{data?.user.name}</p>
              <p className="text-sm text-slate-400">{data?.createdAt}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <UpdatePost id={data?.id} />
            <DeletePost id={data?.id} />
          </div>
        </div>
        {data?.body && <h2 className="mb-4">{data?.body}</h2>}
        {data?.image && (
          <img
            src={data?.image}
            className="w-full rounded-md"
            alt={data?.body}
          />
        )}
        {data?.comments?.length > 0 &&
          data?.comments?.map((comment) => (
            <Comment key={comment._id} comment={comment} />
          ))}
        <CreateCommentModal postId={data?._id} />
      </div>
    </>
  );
}
