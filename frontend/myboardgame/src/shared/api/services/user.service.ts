import { promises } from "dns";
import axiosClient from "../axiosClient"
import { InitialUserModel } from "../../../entities/InitUserModel";

const serviceApiUser = {
  updateUser(id: number, body: InitialUserModel): any {
    var data = {
      id: id, ...body
    };
    console.log("body in user service:", data);
    return axiosClient.patch("/api/user/update", data)
  } 
}
export default serviceApiUser