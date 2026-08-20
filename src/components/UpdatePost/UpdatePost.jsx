import React, { useState } from "react";
import style from "./UpdatePost.module.css";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
export default function UpdatePost({ id }) {
  let queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      body: "",
      image: "",
    },
  });
  const [isShow, setisShow] = useState(false);

  const { register, handleSubmit } = form;

  async function handleUpdate(values) {
    let data = new FormData();
    data.append("body", values.body);
    data.append("image", values.image[0]);
    axios
      .put(`https://linked-posts.routemisr.com/posts/${id}`, data, {
        headers: { token: localStorage.getItem("userToken") },
      })
      .then((res) => {
        if (res.data.message === "success") {
          toast.success("Post updated successfully");
          queryClient.invalidateQueries({ queryKey: ["getSinglePost"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        }
      })
      .catch((err) => {
        toast.error("Error updating post");
      });
  }

  function changeToggle() {
    setisShow(!isShow);
  }

  return (
    <>
      <button
        onClick={changeToggle}
        className=" cursor-pointer block text-white hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 my-5"
        type="button"
      >
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
          className="lucide lucide-pencil-icon lucide-pencil"
        >
          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>

      {isShow && (
        <div
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
                    onSubmit={handleSubmit(handleUpdate)}
                    className="space-y-4"
                    action="#"
                  >
                    <div>
                      <label
                        htmlFor="body"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Text
                      </label>

                      <input
                        {...register("body")}
                        type="text"
                        id="body"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Post Details"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="image"
                        className="cursor-pointer flex justify-center  mb-2 text-sm font-medium text-gray-900 dark:text-white"
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
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="3"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </label>
                      <input
                        {...register("image")}
                        type="file"
                        id="image"
                        className="bg-gray-50 border hidden border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Update Post
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
