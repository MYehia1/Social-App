import React from "react";
import style from "./CreatePost.module.css";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";

export default function CreatePost() {
  let form = useForm({
    defaultValues: {
      body: "",
      image: "",
    },
  });

  let { register, handleSubmit } = form;

  async function handleAddPost(values) {
    let Data = new FormData();
    Data.append("body", values.body);
    Data.append("image", values.image[0]);
    try {
      let res = await axios.post(
        `https://linked-posts.routemisr.com/posts`,
        Data,
        {
          headers: {
            token: localStorage.getItem("userToken"),
          },
        }
      );
      if (res.data.message === "success") {
        toast.success("Post added successfully");
      }
    } catch (error) {
      toast.error(error.response.data.error);
    }
  }

  return (
    <div className="w-full md:w-[60%] lg:w-[80%] mx-auto bg-slate-200 p-4 rounded-lg my-10">
      <form onSubmit={handleSubmit(handleAddPost)}>
        <div className="flex items-center w-full">
          <div className="w-4/5">
            <input
              {...register("body")}
              className="w-full border-2 border-slate-400 rounded-lg"
              type="text"
              placeholder="What's on your mind?"
            />
          </div>
          <div className="w-1/5">
            <label
              htmlFor="photo"
              className="cursor-pointer flex justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-image-icon lucide-image"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </label>
            <input
              {...register("image")}
              type="file"
              id="photo"
              className="hidden"
            />
          </div>
        </div>
        <div>
          <button className="cursor-pointer w-full bg-blue-600 text-white px-4 py-2 rounded-lg mt-4 hover:bg-blue-700 transition-all duration-300">
            Add Post
          </button>
        </div>
      </form>
    </div>
  );
}
