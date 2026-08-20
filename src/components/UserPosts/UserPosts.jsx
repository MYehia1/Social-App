import React from "react";
import style from "./UserPosts.module.css";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Comment from "../Comment/Comment";
import CreateCommentModal from "../CreateCommentModal/CreateCommentModal";
import UpdatePost from "../UpdatePost/UpdatePost";
import toast from "react-hot-toast";
import DeletePost from "../DeletePost/DeletePost";

export default function UserPosts({ id }) {
  let queryClient = useQueryClient();

  function getUserPosts() {
    return axios.get(
      `https://linked-posts.routemisr.com/users/${id}/posts?limit=2`,
      {
        headers: {
          token: localStorage.getItem("userToken"),
        },
      }
    );
  }
  let { data, isError, isLoading, error } = useQuery({
    queryKey: ["userPosts"],
    queryFn: getUserPosts,
    select: (data) => data?.data?.posts,
  });

  
  return (
    <>
      {data?.map((post) => (
        <div
          key={post.id}
          className="w-full md:w-[80%] lg:w-[60%] rounded-md bg-slate-200 p-4 mx-auto my-8"
        >
          <Link to={`/postdetails/${post?.id}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div>
                  <img
                    src={post?.user.photo}
                    className="size-[36px] rounded-full"
                    alt=""
                  />
                </div>
                <div>
                  <p>{post?.user.name}</p>
                  <p className="text-sm text-slate-400">{post?.createdAt}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <UpdatePost id={post?.id} />
                <DeletePost id={post?.id}/>
              </div>
            </div>

            {post?.body && <h2 className="mb-4">{post?.body}</h2>}
            {post?.image && (
              <img
                src={post?.image}
                className="w-full rounded-md"
                alt={post?.body}
                title={post?.body}
              />
            )}

            {post?.comments?.length > 0 && (
              <Comment comment={post?.comments[0]} />
            )}
          </Link>
          <CreateCommentModal postId={post.id} />
        </div>
      ))}
    </>
  );
}
