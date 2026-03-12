import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type UpdatedAlertOptions = {
  title: string;
  message: string;
};

export const showUpdatedSweetAlert = async ({ title, message }: UpdatedAlertOptions) => {
  return Swal.fire({
    title,
    html: `
      <div style="display:flex; justify-content:center; margin:18px 0 8px;">
        <div style="width:76px; height:76px; border-radius:9999px; background:#2FBF71; display:flex; align-items:center; justify-content:center;">
          <span style="color:#fff; font-size:44px; font-weight:800; line-height:1;">✓</span>
        </div>
      </div>
      <p style="font-size:14px; color:#6b7280; text-align:center; margin:10px 0 0;">
        ${message}
      </p>
    `,
    showCloseButton: true,
    showConfirmButton: false,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-lg",
      title: "text-3xl font-extrabold text-black",
      closeButton: "text-gray-400 hover:text-black",
    },
  });
};

type ConnectedAlertOptions = {
  title?: string;
  message?: string;
};

export const showConnectedSweetAlert = async ({
  title = "Connected",
  message = "Online Aggregator connected Successfully!",
}: ConnectedAlertOptions = {}) => {
  return Swal.fire({
    title,
    html: `
      <div style="display:flex; justify-content:center; margin:18px 0 8px;">
        <div style="width:76px; height:76px; border-radius:9999px; background:#2FBF71; display:flex; align-items:center; justify-content:center;">
          <span style="color:#fff; font-size:44px; font-weight:800; line-height:1;">✓</span>
        </div>
      </div>
      <p style="font-size:14px; color:#6b7280; text-align:center; margin:10px 0 0;">
        ${message}
      </p>
    `,
    showCloseButton: true,
    showConfirmButton: false,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-lg",
      title: "text-3xl font-extrabold text-black",
      closeButton: "text-gray-400 hover:text-black",
    },
  });
};
