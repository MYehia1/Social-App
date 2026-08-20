import React from "react";
import style from "./Profile.module.css";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import UserPosts from "./../UserPosts/UserPosts";
import ChangePasswordModal from "../ChangePasswordModal/ChangePasswordModal";
import UploadProfilePicture from "../UploadProfilePicture/UploadProfilePicture";
import { Camera } from "lucide-react";

export default function Profile() {
  function getUserData() {
    return axios.get(`https://linked-posts.routemisr.com/users/profile-data`, {
      headers: { token: localStorage.getItem("userToken") },
    });
  }
  let { data, isError, isLoading, error } = useQuery({
    queryKey: ["userData"],
    queryFn: getUserData,
    select: (data) => data?.data?.user,
  });

  return (
    <>
      <div className="flex flex-col m-5 gap-2 text-center w-full md:w[80%] lg:w-[60%] mx-auto rounded-lg p-4 border-2">
        <div className="flex flex-col items-center gap-2">
          <img
            src={data?.photo}
            className="size-[50px] rounded-full mx-auto"
            alt=""
          />
          <UploadProfilePicture />
        </div>
        <span>Name:{data?.name}</span>
        <span>Gender:{data?.gender}</span>
        <span>Email address:{data?.email}</span>
        <span>Birthday:{data?.dateOfBirth}</span>
      </div>
      <div className="flex justify-center gap-2 text-center w-full md:w[80%] lg:w-[60%] mx-auto rounded-lg p-4 border-2">
        <ChangePasswordModal />
      </div>
      {data && <UserPosts id={data?._id} />}
    </>
  );
}
