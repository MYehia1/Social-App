import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Comment from "../Comment/Comment";
import { Link } from "react-router-dom";
import CreateCommentModal from "./../CreateCommentModal/CreateCommentModal";
import CreatePost from './../CreatePost/CreatePost';

export default function Home() {
  function getAllPosts() {
    return axios.get(`https://linked-posts.routemisr.com/posts?limit=50`, {
      headers: {
        token: localStorage.getItem("userToken"),
      },
    });
  }
  let { data, isError, isLoading, error } = useQuery({
    queryKey: ["getPosts"],
    queryFn: getAllPosts,
    select: (data) => data?.data?.posts,
  });
  
  if (isError) {
    return <h3>{error.message}</h3>;
  }
  if (isLoading) {
    return <div className="h-screen flex justify-center items-center"> <span className="loader flex items-center justify-center"></span></div>;
  }
  return (
    <>
    <CreatePost />
      {data.map((post) => (
        <div key={post.id} className="w-full md:w-[80%] lg:w-[60%] rounded-md bg-slate-200 p-4 mx-auto my-8">
          <Link  to={`/postdetails/${post.id}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <img
                  src={post.user.photo}
                  className="size-[36px] rounded-full"
                  alt=""
                />
                <p>{post.user.name}</p>
              </div>
              <div className="text-sm text-slate-400">{post.createdAt}</div>
            </div>
            {post.body && <h2 className="mb-4">{post.body}</h2>}
            {post.image && (
              <img
                src={post.image}
                className="w-full rounded-md"
                alt={post.body}
                title={post.body}
              />
            )}

            {post?.comments?.length > 0 && (
              <Comment comment={post.comments[0]} />
            )}
          </Link>
          <CreateCommentModal postId={post.id} />
        </div>
      ))}
    </>
  );
}
