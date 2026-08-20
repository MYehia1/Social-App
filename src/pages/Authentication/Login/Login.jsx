import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";
import axios from "axios";
import { useNavigate } from "react-router";
import { UserContext } from "../../../context/UserContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  let {userLogin, setUserLogin} = useContext(UserContext)
  const schema = z
    .object({
      
      email: z.email("invalid email address"),
      password: z
        .string()
        .regex(
          /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
          "must includes 1 capital letter, 1 small letter at least, 1 number and 1 special character and min length is 8 characters"
        )
      
      
    });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(schema),
  });

  let { register, handleSubmit, formState } = form;

  function handleLogin(values) {
    setIsLoading(true);
    axios
      .post(`https://linked-posts.routemisr.com/users/signin`, values)
      .then((res) => {
        if (res.data.message === "success") {
          setIsLoading(false);
          navigate("/");
          localStorage.setItem("userToken", res.data.token);
          setUserLogin(res.data.token)
          toast.success("Logged in successfully")
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setApiError(err.response.data.error);
        toast.error(apiError);
        
      });
  }
  return (
    <>
      <form
        onSubmit={handleSubmit(handleLogin)}
        className="max-w-md mx-auto mt-10"
      >
      
          
        

        
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="email"
            {...register("email")}
            id="email"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-blackdark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          />
          <label
            htmlFor="email"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Email
          </label>
          {formState.errors.email && formState.touchedFields.email ? (
            <p className="text-red-500 font-normal text-center my-2">
              {formState.errors.email.message}
            </p>
          ) : (
            ""
          )}
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="password"
            {...register("password")}
            id="password"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-blackdark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          />
          <label
            htmlFor="password"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Password
          </label>
          {formState.errors.password && formState.touchedFields.password ? (
            <p className="text-red-500 font-normal text-center my-2">
              {formState.errors.password.message}
            </p>
          ) : (
            ""
          )}
        </div>
        

        <button
        disabled={isLoading}
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mt-15"
        >
          {isLoading ? <i className="fas fa-spinner fa-spin text-white"></i> : "Login"}
        </button>
      </form>
    </>
  );
}

