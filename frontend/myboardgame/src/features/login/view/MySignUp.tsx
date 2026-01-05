
// import { useState } from "react";
// type MySignInProp = {
//   username: string;
//   password: string;
//   age: number;
//   email: string;
// };

// const MySignIn = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [passwordReEnter, setPasswordReEnter] = useState("");
//   const [email, setEmail] = useState("");
//   const [result, setResult] = useState({})

//   const handleChangeUsername = (event: any) => {
//     setUsername((prev) => event.target.value);
//   };
//   const handleChangeEmail = (event: any) => {
//     setEmail((prev) => event.target.value);
//   };
//   const handleChangePassword = (event: any) => {
//     setPassword((prev) => event.target.value);
//   };
//   const handleChangePasswordReEnter = (event: any) => {
//     setPasswordReEnter((prev) => event.target.value);
//   };

//   const handleSignUp = () => {
//     // call api from serviceApiAuth
//     // thêm loading
//   }

//   return (
//     <>
//       <div className="w-screen h-screen flex flex-col items-center justify-center">
//         {/* Animation background */}
//         {/* CustomRotateCards */}

//         {/* Name */}
//         <div
//           className="absolute w-screen top-10
//                   text-center text-white font-bold text-7xl drop-shadow-2xl font-serif"
//         >
//           Exploding Kittens
//         </div>

//         {/* Align item */}

//         <form  className="flex flex-col">
//           <input
//             type="text"
//             value={username}
//             onChange={handleChangeUsername}
//             placeholder="Enter your name"
//             className="h-[50px] w-[400px] rounded-2xl px-5 m-1"
//           />
//           <div></div>
//           <input
//             type="email"
//             value={email}
//             onChange={handleChangeEmail}
//             placeholder="Enter your email"
//             className=" h-[50px] w-[400px] rounded-2xl px-5 m-1"
//           />
//           <input
//             type="password"
//             value={password}
//             onChange={handleChangePassword}
//             placeholder="Enter your password"
//             className=" h-[50px] w-[400px] rounded-2xl px-5 m-1"
//           />
//           <div className="w-[400px] text-[10px] pl-[5px]">Password must be 6-30 characters long, contain lowercase, uppercase and at least 1 special character</div>
//           <input
//             type="password"
//             value={passwordReEnter}
//             onChange={handleChangePasswordReEnter}
//             placeholder="Re-enter your password"
//             className=" h-[50px] w-[400px] rounded-2xl px-5 m-1"
//           />
//           <div>
//             {password != "" && passwordReEnter != "" && password != passwordReEnter ? "Khong hop le" : ""}
//           </div>
//           <button>Sign up</button>
//         </form>
//       </div>
//     </>
//   );
// };

// export default MySignIn;


import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import serviceApiAuth from "../../../shared/api/services/auth.service";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";

export const schema = yup.object({
  username: yup.string().required("Username không được để trống"),
  email: yup
    .string()
    .required("Email không được để trống")
    .email("Email không hợp lệ"),
  password: yup
    .string()
    .required("Password không được để trống")
    .min(8, "Password phải ít nhất 8 ký tự")
    .matches(/[A-Z]/, "Password phải có chữ hoa")
    .matches(/[a-z]/, "Password phải có chữ thường")
    .matches(/[0-9]/, "Password phải có số"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Password không trùng khớp")
    .required("Vui lòng xác nhận lại password"),
  age: yup.number().max(100),
});

export default function MySignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      const result = await serviceApiAuth.signUp(data);
      console.log("MySignUp: ", result)

      const success = result?.success === true;
      const message = result?.message || "Unknown response";

      if (success) {
        toast.success(message || "Tạo tài khoản thành công!");
        navigate("/login");
        return;
      }

      toast.error(message || "Đăng ký thất bại!");

    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi không xác định từ server";

      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const pushToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="w-screen h-screen mx-auto mt-10 flex flex-col gap-4">
      <div className="w-screen text-center text-white font-bold text-7xl drop-shadow-2xl font-serif">
        Exploding Kittens
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-[400px] mx-auto mt-10 flex flex-col gap-4"
      >
        {/* Username */}
        <div className="flex flex-col">
          <input
            {...register("username")}
            placeholder="Username"
            className="h-[50px] px-5 rounded-xl border transition-all duration-300 hover:rounded-3xl"
          />
          {errors.username && (
            <span className="text-red-500 text-sm mt-1">
              {errors.username.message}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <input
            {...register("email")}
            placeholder="Email"
            className="h-[50px] px-5 rounded-xl border transition-all duration-300 hover:rounded-3xl"
          />
          {errors.email && (
            <span className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="h-[50px] px-5 rounded-xl border transition-all duration-300 hover:rounded-3xl"
          />
          {errors.password && (
            <span className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col">
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="Confirm Password"
            className="h-[50px] px-5 rounded-xl border transition-all duration-300 hover:rounded-3xl"
          />
          {errors.confirmPassword && (
            <span className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`h-[50px] rounded-xl bg-black text-white text-[20px] font-bold mt-3 
            flex items-center justify-center transition-colors duration-300
            ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-300"}
          `}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Sign Up"
          )}
        </button>

        {/* Go to login */}
        <button
          onClick={pushToLogin}
          type="button"
          className="h-[50px] rounded-xl bg-zinc-50 text-black text-[20px] font-bold hover:bg-green-200 transition-colors duration-300"
        >
          Go To Login
        </button>
      </form>
    </div>
  );
}

