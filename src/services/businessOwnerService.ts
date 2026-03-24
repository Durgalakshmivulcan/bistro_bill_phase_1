import { api } from "./api";
import { ApiResponse } from "../types/api";

interface BusinessOwnerProfile {
  id: string;
  email: string;
  ownerName: string;
  phone?: string;
  avatar?: string;
}

export const updateBusinessOwnerProfile = async (
  data: { ownerName: string; phone?: string },
  avatar?: File
): Promise<ApiResponse<BusinessOwnerProfile>> => {

  const formData = new FormData();
  formData.append("ownerName", data.ownerName);
  formData.append("phone", data.phone || "");

  if (avatar) {
    formData.append("avatar", avatar);
  }

  return api.put<ApiResponse<BusinessOwnerProfile>>(
    "/business-owner/profile",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

export const deleteBusinessOwnerAvatar = async (): Promise<ApiResponse> => {
  return api.delete<ApiResponse>("/business-owner/profile/avatar");
};
