import React from "react";
import style from "./DeletePost.module.css";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
export default function DeletePost({id}) {
  let navigate = useNavigate();
  function deletePost(postId) {
    axios
      .delete(`https://linked-posts.routemisr.com/posts/${postId}`, {
        headers: { token: localStorage.getItem("userToken") },
      })
      .then((res) => {
        if (res.data.message === "success") {
          toast.success("Post deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["userPosts"] });
          queryClient.invalidateQueries({ queryKey: ["getSinglePost"] });
          navigate("/profile");
        }
      })
      .catch((err) => {
        toast.error(err.response.data.error);        
      });
  }
  return (
    <button
      onClick={() => deletePost(id)}
      className="flex items-center bg-red-500 text-white text-sm px-5 py-2.5 rounded-lg cursor-pointer hover:bg-red-800"
    >
      Delete
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-trash-icon lucide-trash"
      >
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}
