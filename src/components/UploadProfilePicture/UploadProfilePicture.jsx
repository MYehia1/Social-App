import React, { useState } from "react";
import style from "./UploadProfilePicture.module.css";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadProfilePicture() {
  const [isShow, setisShow] = useState(false);
  const data = new FormData();
  const form = useForm({
    defaultValues: {
      photo: "",
    },
  });
  let { register, handleSubmit } = form;

  function handleUploadPicture(values) {
    data.append("photo", values.photo[0]);
    axios
      .put(`https://linked-posts.routemisr.com/users/upload-photo`, data, {
        headers: { token: localStorage.getItem("userToken") },
      })
      .then((res) => {
        if (res.data.message === "success") {
          toast.success("Picture changed successfully");
          changeToggle();
        }
      })
      .catch((err) => toast.error(err.response.data.message));
  }

  function changeToggle() {
    setisShow(!isShow);
  }

  return (
    <>
      <div>
        {/* Modal toggle */}

        <button
          onClick={changeToggle}
          data-modal-target="authentication-modal"
          data-modal-toggle="authentication-modal"
          className="flex items-center gap-2 cursor-pointer text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
        >
          <Camera />
          Update Profile Picture
        </button>
        {/* Main modal */}
        {isShow && (
          <div
            id="authentication-modal"
            tabIndex={-1}
            aria-hidden="true"
            className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
          >
            <div className="relative p-4 w-full">
              {/* Modal content */}
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700 w-md z-50">
                  {/* Modal header */}
                  <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 flex gap-2 items-center dark:text-white">
                      Choose Profile Picture
                    </h3>
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
                  {/* Modal body */}
                  <div className="p-4 md:p-5">
                    <form
                      onSubmit={handleSubmit(handleUploadPicture)}
                      className="space-y-4"
                      action="#"
                    >
                      <div>
                        <input
                          type="file"
                          {...register("photo")}
                          id="photo"
                          className="hidden bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                        />
                        <label className="flex mb-5 justify-center cursor-pointer " htmlFor="photo">
                          <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          className="lucide lucide-image-icon lucide-image size-10 text-white"
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
                      </div>

                      <button
                        type="submit"
                        className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Confirm Upload Picture
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
