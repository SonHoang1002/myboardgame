import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import serviceApiAuth from "../../../shared/api/services/auth.service";
import { useNavigate } from "react-router-dom";
import "../css/login.css";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { ContextLocalData } from "../../../app/providers/LocalDataContext";
import LocalStorageUtil from "../../../shared/utils/LocalStorageUtil";

export const loginSchema = yup.object({
  username: yup.string().required("Username không được để trống"),

  password: yup
    .string()
    .required("Password không được để trống")
    .min(8, "Password phải ít nhất 8 ký tự")
    .matches(/[A-Z]/, "Password phải có chữ hoa")
    .matches(/[a-z]/, "Password phải có chữ thường")
    .matches(/[0-9]/, "Password phải có số"),
});

export default function MyLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const localDataContext = useContext(ContextLocalData);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  // =======================
  // HANDLE LOGIN
  // =======================
  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      const result = await serviceApiAuth.login(data) as any;
      console.log("serviceApiAuth.login result", result);

      const success = result?.success == true; /// luôn luôn falsem ahyx sửa lại cho đúng cấu trúc data trả về
      const message = result?.message || "Đăng nhập thành công!";

      if (success) {
        toast.success(message);
        const data = result?.data;
        const localData = {
          accessToken: data?.accessToken,
          refreshToken: data?.refreshToken,
          user: data?.user,
        }
        localDataContext?.onUpdateAll(
          localData
        )
        LocalStorageUtil.setLocalData(
          localData
        )
        navigate("/initial_user", {
          replace: true
        });
        return;
      }

      toast.error(result?.data?.message || "Đăng nhập thất bại!");

    } catch (error: any) {
      console.log("onSubmit error: ", error);

      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi kết nối tới server";

      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const pushToSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="w-screen h-screen mx-auto mt-10 flex flex-col gap-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-[400px] mx-auto mt-10 flex flex-col gap-4"
      >
        {/* Username */}
        <div className="flex flex-col">
          <div className="relative mt-4">
            <input
              id="inputUsername"
              {...register("username")}
              placeholder=" "
              className="
              peer
              w-full
              h-[50px] 
              px-5 
              rounded-xl 
              outline-none 
              border-b-4 
              border-red-500
              focus:border-green-500
            "
            />
            <label
              htmlFor="inputUsername"
              className="
              absolute 
              left-3 
              top-3 
              text-base
              transition-all 
              duration-300 
              
              peer-placeholder-shown:top-3
              peer-placeholder-shown:text-base 

              peer-[&:not(:placeholder-shown)]:-top-3
              peer-[&:not(:placeholder-shown)]:text-sm
              peer-[&:not(:placeholder-shown)]:text-blue-500 

              peer-focus:-top-3
              peer-focus:text-sm
              peer-focus:text-blue-500
            "
            >
              Username
            </label>
          </div>
          {errors.username && (
            <span className="text-red-500 text-sm mt-1">
              {errors.username.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <input
            {...register("password")}
            type="password"
            placeholder=" "
            className="peer w-full h-[50px] px-5 rounded-xl transition-all duration-300 outline-none border-b-4 border-red-500 focus:border-green-500"
          />
          <label
            htmlFor="inputPassword"
            className="
              absolute top-3 left-3 text-base
              transition-all duration-300

              peer-placeholder-shown:top-3
              peer-placeholder-shown:left-3
              peer-placeholder-shown:text-base

              peer-[&:not(:placeholder-shown)]:-top-3
              peer-[&:not(:placeholder-shown)]:text-blue-500
              peer-[&:not(:placeholder-shown)]:text-sm

              peer-focus:-top-3
              peer-focus:text-sm
              peer-focus:text-blue-500
            "
          >
            Password
          </label>
          {errors.password && (
            <span className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`
            h-[50px] rounded-xl bg-blue-600 text-white text-[20px] font-bold mt-3 
            flex items-center justify-center
            transition-colors duration-300
            ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"}
          `}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Login"
          )}
        </button>

        <button
          onClick={pushToSignup}
          type="button"
          className="h-[50px] rounded-xl bg-zinc-50 text-black text-[20px] font-bold hover:bg-red-700 hover:text-blue-500 transition-colors duration-300"
        >
          Go To Sign Up
        </button>

      </form>
    </div>
  );
}
