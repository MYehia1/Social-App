import React, { useState } from "react";
import style from "./CreateCommentModal.module.css";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
export default function CreateCommentModal({ postId }) {
  let queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      content: "",
      post: postId,
    },
  });
  const [isShow, setisShow] = useState(false);
  const { register, handleSubmit } = form;
  async function addComment(value) {
    try {
      let res = await axios.post(
        `https://linked-posts.routemisr.com/comments`,
        value,
        {
          headers: {
            token: localStorage.getItem("userToken"),
          },
        }
      );
      if (res.data.message === "success") {
        toast.success("Comment added successfully");
        queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        changeToggle();
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  function changeToggle() {
    setisShow(!isShow);
  }

  return (
    <>
      <button
        onClick={changeToggle}
        data-modal-target="authentication-modal"
        className="w-full cursor-pointer block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 my-5"
        type="button"
      >
        Add Comment
      </button>

      {isShow && (
        <div
          id="authentication-modal"
          tabIndex="-1"
          aria-hidden="true"
          className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
        >
          <div className="relative p-4 w-full">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700 w-md z-50">
                <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                  <button
                    onClick={changeToggle}
                    type="button"
                    className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    data-modal-hide="authentication-modal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6 text-red-600 cursor-pointer"
                      title="Close"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="sr-only">Close modal</span>
                  </button>
                </div>
                <div className="p-4 md:p-5">
                  <form
                    onSubmit={handleSubmit(addComment)}
                    className="space-y-4"
                    action="#"
                  >
                    <div>
                      <label
                        htmlFor="comment"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Comment
                      </label>

                      <input
                        {...register("content")}
                        type="text"
                        id="comment"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="postid"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      ></label>
                      <input
                        {...register("post")}
                        value={postId}
                        type="hidden"
                        id="postid"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Add Comment
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
